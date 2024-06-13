import { MaybePromise } from "../../utils/types";
import path from "node:path";
import fs from "node:fs/promises";
import { FinalUserConfig, mergeConfig } from "../../utils/config";
import { type ReleaseType } from "semver";
import { BumpResult, bump } from "./bump";
import { message } from "../../utils/message";
import { createFsUtils } from "../../utils/fs";
import {
  changelog,
  changelogContentParser,
  changelogContentStringify,
} from "./changelog";
import { CommitData } from "./commit";

export interface ReleaseConfigPkgFileContent {
  version: string;
}

export interface ReleaseChangelogFileContent {
  header?: string;
  body?: string;
  footer?: string;
}

export interface ReleaseConfig {
  scope?: string;
  pkgFilePath: string;
  pkgFilePathResolve: (config: FinalUserConfig) => MaybePromise<string>;
  readPkgFile: (
    config: FinalUserConfig
  ) => MaybePromise<ReleaseConfigPkgFileContent>;
  disableWriteVersion?: boolean;
  writeVersion: (
    config: FinalUserConfig,
    bumpRes: BumpResult
  ) => MaybePromise<void>;
  changelogFilePath: string;
  readChangelogFile: (
    config: FinalUserConfig
  ) => MaybePromise<ReleaseChangelogFileContent>;
  disableWriteChangelogFile?: boolean;
  writeChangelogFile: (
    config: FinalUserConfig,
    changelogRes: ReleaseChangelogFileContent
  ) => MaybePromise<void>;
  changelogHeader?: string;
  changelogFooter?: string;
  releaseAs?: string;
  releaseType?: ReleaseType;
  releasePre?: boolean;
  releasePreTag?: string;
  tagPrefix: string;
  commitMessage?: string;
  commitMessageFormat: (
    config: FinalUserConfig,
    data: CommitData
  ) => MaybePromise<string>;
  commitFilesCollect: (
    config: FinalUserConfig,
    data: CommitData
  ) => MaybePromise<string[]>;
}

export const releaseDefaultConfig: ReleaseConfig = {
  pkgFilePath: "package.json",
  pkgFilePathResolve: async (config) => {
    const { release } = config;
    const { pkgFilePath } = release;
    const pkgFileAbsolutePath = path.resolve(process.cwd(), pkgFilePath);
    return pkgFileAbsolutePath;
  },
  changelogFilePath: "CHANGELOG.md",
  readPkgFile: async (config) => {
    const { release } = config;
    const { pkgFilePath } = release;
    if (!pkgFilePath) {
      throw new Error(message.releaseUndefinedPkgFilePathConfig());
    }
    const pkgFileAbsolutePath = path.resolve(process.cwd(), pkgFilePath);
    const fsUtils = createFsUtils(fs);
    const content = await fsUtils.readJson<ReleaseConfigPkgFileContent>(
      pkgFileAbsolutePath
    );
    return content;
  },
  writeVersion: async (config, bumpRes) => {
    const { release } = config;
    const { pkgFilePath } = release;
    if (!pkgFilePath) {
      throw new Error(message.releaseUndefinedPkgFilePathConfig());
    }
    const version = bumpRes?.version;
    if (!version) {
      return;
    }
    if (version === bumpRes.oldVersion) {
      return;
    }
    const pkgPath = path.resolve(process.cwd(), pkgFilePath);
    const fsUtils = createFsUtils(fs);
    await fsUtils.modifyJson<ReleaseConfigPkgFileContent>(pkgPath, (value) => {
      return {
        ...value,
        version,
      };
    });
  },
  readChangelogFile: async (config) => {
    const { release } = config;
    const { changelogFilePath } = release;
    if (!changelogFilePath) {
      throw new Error(message.releaseUndefinedChangelogFilePathConfig());
    }
    const changelogFileAbsolutePath = path.resolve(
      process.cwd(),
      changelogFilePath
    );
    const content = await fs.readFile(changelogFileAbsolutePath, "utf-8");
    return changelogContentParser(content);
  },
  writeChangelogFile: async (config, changelogRes = {}) => {
    const { release } = config;
    const { changelogFilePath } = release;
    if (!changelogFilePath) {
      throw new Error(message.releaseUndefinedChangelogFilePathConfig());
    }
    const changelogFileAbsolutePath = path.resolve(
      process.cwd(),
      changelogFilePath
    );
    const fsUtils = createFsUtils(fs);
    const changelogContent = changelogContentStringify(changelogRes);
    console.log({ changelogContent });
    await fsUtils.outputFile(changelogFileAbsolutePath, changelogContent);
  },
  commitMessageFormat: async (config, data = {}) => {
    const { release } = config;
    const { scope } = release;
    const { bumpRes } = data;
    return `release${scope ? `(${scope})` : ``}:${bumpRes?.version}`;
  },
  commitFilesCollect: async (config, data) => {
    const { release } = config;
    const { disableWriteVersion, disableWriteChangelogFile } = release;
    const { bumpRes, changelogRes } = data;
    const files: string[] = [];
    if (!disableWriteVersion) {
      if (bumpRes?.oldVersion !== bumpRes?.version) {
        // const pkgFileAbsolutePath = await
      }
    }
    return files;
  },
  tagPrefix: "v",
};

// TODO 实现 scope?
// 还有commit？
// 甚至 test?
export const release = async (config: FinalUserConfig) => {
  const { release } = config;
  const { disableWriteVersion, writeVersion } = release;
  const bumpRes = await bump(config);
  console.log({ bumpRes });
  if (!disableWriteVersion) {
    await writeVersion?.(config, bumpRes);
  }
  await changelog(config);
};
