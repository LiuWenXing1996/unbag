import semver, { type ReleaseType } from "semver";
import { message } from "../../utils/message";
//@ts-ignore
import type { Commit } from "conventional-commits-parser";
//@ts-ignore
import type { Bumper } from "conventional-recommended-bump";
//@ts-ignore
import type { BumperRecommendation } from "conventional-recommended-bump";
import { FinalUserConfig } from "../../utils/config";
import { MaybePromise } from "../../utils/types";
import { usePath } from "../../utils/path";
import { useFs } from "../../utils/fs";

export interface VersionFileFileContent {
  version: string;
}

export interface ReleaseBumpConfig {
  versionFilePath: string;
  versionFilePathResolve: (params: {
    config: FinalUserConfig;
  }) => MaybePromise<string>;
  versionFileRead: (params: {
    config: FinalUserConfig;
  }) => MaybePromise<VersionFileFileContent>;
  versionFileWrite: (params: {
    config: FinalUserConfig;
    bumpRes: BumpResult;
  }) => MaybePromise<void>;
  versionFileWriteDisable?: boolean;
}

export const ReleaseBumpConfigDefault: ReleaseBumpConfig = {
  versionFilePath: "package.json",
  versionFilePathResolve: async ({ config }) => {
    const {
      release: {
        bump: { versionFilePath },
      },
      root,
    } = config;
    const path = usePath();
    const absolutePath = path.resolve(root, versionFilePath);
    return absolutePath;
  },
  versionFileRead: async ({ config }) => {
    const {
      release: {
        bump: { versionFilePathResolve },
      },
    } = config;
    const pkgFileAbsolutePath = await versionFilePathResolve({ config });
    const fs = useFs();
    const content = await fs.readJson<VersionFileFileContent>(
      pkgFileAbsolutePath
    );
    return content;
  },
  versionFileWrite: async ({ config, bumpRes }) => {
    const {
      release: {
        bump: { versionFilePathResolve },
      },
    } = config;
    const pkgFileAbsolutePath = await versionFilePathResolve({ config });
    const version = bumpRes?.version;
    if (!version) {
      return;
    }
    if (version === bumpRes.oldVersion) {
      return;
    }
    const fs = useFs();
    await fs.modifyJson<VersionFileFileContent>(
      pkgFileAbsolutePath,
      (value) => {
        return {
          ...value,
          version,
        };
      }
    );
  },
};

export const VERSIONS = ["major", "minor", "patch"] as const;

export const getCommits = async (bumper: Bumper) => {
  //@ts-ignore
  const commitsStream = bumper.commitsGetter();
  const commits: Commit[] = [];
  let commit: Commit;

  for await (commit of commitsStream) {
    commits.push(commit);
  }
  return commits;
};

export const isReleaseType = (value: string): value is ReleaseType => {
  return semver.RELEASE_TYPES.includes(value as any);
};

export const isInPrerelease = (version: string) => {
  return Array.isArray(semver.prerelease(version));
};

export const genVersionByCommits = async (
  config: FinalUserConfig,
  data: {
    oldVersion: string;
  }
): Promise<BumpResult> => {
  const { release } = config;
  const { scope, releasePre, releasePreTag, tagPrefix } = release;
  const { oldVersion } = data;
  const { Bumper } = await import("conventional-recommended-bump");
  const bumper = new Bumper();
  const presetPath = require.resolve(
    "conventional-changelog-conventionalcommits"
  );
  bumper.loadPreset(presetPath);
  bumper.tag({ prefix: tagPrefix });
  let commits = await getCommits(bumper);
  if (scope) {
    commits = commits.filter((e) => e.scope === scope);
  }
  if (commits.length <= 0) {
    return {
      version: oldVersion,
      oldVersion,
    };
  }
  // @ts-ignore
  const result = (await bumper.whatBump(commits)) as
    | BumperRecommendation
    | undefined;

  let releaseType: string | undefined = undefined;
  if (result && typeof result.level === "number") {
    releaseType = VERSIONS[result.level];
  }

  if (!releaseType) {
    throw new Error(message.releaseBumpGenUnValidReleaseType());
  }

  if (releasePre) {
    if (isInPrerelease(oldVersion)) {
      releaseType = "prerelease";
    } else {
      releaseType = `pre${releaseType}`;
    }
  }
  if (!isReleaseType(releaseType)) {
    throw new Error(message.releaseBumpGenUnValidReleaseType());
  }
  const version = semver.inc(oldVersion, releaseType, releasePreTag);
  if (!version) {
    throw new Error(message.releaseBumpGenUnValidVersion());
  }
  return {
    version,
    oldVersion,
    releaseType,
    commits,
  };
};

export interface BumpResult {
  oldVersion: string;
  version: string;
  releaseType?: ReleaseType;
  commits?: Commit[];
}

export const useReleaseBump = ({ config }: { config: FinalUserConfig }) => {
  const {
    release: {
      bump: { versionFileRead },
    },
  } = config;
  return async () => {
    const versionFileContent = await versionFileRead({ config });
    if (!versionFileContent) {
      throw new Error(message.releaseBumpNotFoundPkgFile());
    }
  };
};

export const bump = async (config: FinalUserConfig): Promise<BumpResult> => {
  const { release } = config;
  const { readPkgFile, releaseAs, releaseType, releasePreTag } = release;
  const pkgFileContent = await readPkgFile?.(config);
  if (!pkgFileContent) {
    throw new Error(message.releaseBumpNotFoundPkgFile());
  }
  const oldVersion = pkgFileContent.version;
  if (releaseAs) {
    if (!semver.valid(releaseAs)) {
      throw new Error(message.releaseBumpInputUnValidReleaseAs(releaseAs));
    }
    return {
      version: releaseAs,
      oldVersion,
    };
  }
  if (releaseType) {
    if (!isReleaseType(releaseType)) {
      throw new Error(message.releaseBumpInputUnValidReleaseType(releaseType));
    }
    const version = semver.inc(oldVersion, releaseType, releasePreTag);
    if (!version) {
      throw new Error(message.releaseBumpGenUnValidVersion());
    }
    return {
      version,
      oldVersion,
      releaseType,
    };
  }

  return await genVersionByCommits(config, { oldVersion });
};
