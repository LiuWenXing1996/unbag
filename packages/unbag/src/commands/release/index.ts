import { MaybePromise } from "../../utils/types";
import path from "node:path";
import fs from "node:fs/promises";
import { FinalUserConfig, mergeConfig } from "../../utils/config";
import { type ReleaseType } from "semver";
import {
  BumpResult,
  ReleaseBumpConfig,
  ReleaseBumpConfigDefault,
  bump,
} from "./bump";
import { message } from "../../utils/message";
import { createFsUtils } from "../../utils/fs";
import {
  changelog,
  changelogContentParser,
  changelogContentStringify,
} from "./changelog";
import { CommitData, commit } from "./commit";
import { TagData, tag } from "./tag";
import { getCurrentBranch } from "../../utils/git";
import { useChalk } from "../../utils/common";
import {
  ReleaseBranchConfig,
  ReleaseBranchConfigDefault,
  branch,
} from "./branch";

export enum LogType {
  message = "message",
  warn = "warn",
  error = "error",
}

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
  branch: ReleaseBranchConfig;
  bump: ReleaseBumpConfig;
  // pkgFilePath: string;
  // pkgFilePathResolve: (config: FinalUserConfig) => MaybePromise<string>;
  // readPkgFile: (
  //   config: FinalUserConfig
  // ) => MaybePromise<ReleaseConfigPkgFileContent>;
  // disableWriteVersion?: boolean;
  // writeVersion: (
  //   config: FinalUserConfig,
  //   bumpRes: BumpResult
  // ) => MaybePromise<void>;
  changelogFilePath: string;
  changelogFilePathResolve: (config: FinalUserConfig) => MaybePromise<string>;
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
  tagForce?: boolean;
  commitMessage?: string;
  tagMessageFormat: (
    config: FinalUserConfig,
    data: TagData
  ) => MaybePromise<string>;
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
  bump: ReleaseBumpConfigDefault,
  pkgFilePath: "package.json",
  pkgFilePathResolve: async (config) => {
    const { release, root } = config;
    const { pkgFilePath } = release;
    const absolutePath = path.resolve(root, pkgFilePath);
    return absolutePath;
  },
  changelogFilePath: "CHANGELOG.md",
  changelogFilePathResolve: async (config) => {
    const { release, root } = config;
    const { changelogFilePath } = release;
    const absolutePath = path.resolve(root, changelogFilePath);
    return absolutePath;
  },
  readPkgFile: async (config) => {
    const { release } = config;
    const { pkgFilePathResolve } = release;
    const pkgFileAbsolutePath = await pkgFilePathResolve(config);
    const fsUtils = createFsUtils(fs);
    const content = await fsUtils.readJson<ReleaseConfigPkgFileContent>(
      pkgFileAbsolutePath
    );
    return content;
  },
  writeVersion: async (config, bumpRes) => {
    const { release } = config;
    const { pkgFilePathResolve } = release;
    const pkgFileAbsolutePath = await pkgFilePathResolve(config);
    const version = bumpRes?.version;
    if (!version) {
      return;
    }
    if (version === bumpRes.oldVersion) {
      return;
    }
    const fsUtils = createFsUtils(fs);
    await fsUtils.modifyJson<ReleaseConfigPkgFileContent>(
      pkgFileAbsolutePath,
      (value) => {
        return {
          ...value,
          version,
        };
      }
    );
  },
  readChangelogFile: async (config) => {
    const { release } = config;
    const { changelogFilePathResolve } = release;
    const changelogFileAbsolutePath = await changelogFilePathResolve(config);
    const content = await fs.readFile(changelogFileAbsolutePath, "utf-8");
    return changelogContentParser(content);
  },
  writeChangelogFile: async (config, changelogRes = {}) => {
    const { release } = config;
    const { changelogFilePathResolve } = release;
    const changelogFileAbsolutePath = await changelogFilePathResolve(config);
    const fsUtils = createFsUtils(fs);
    const changelogContent = changelogContentStringify(changelogRes);
    await fsUtils.outputFile(changelogFileAbsolutePath, changelogContent);
  },
  commitMessageFormat: async (config, data) => {
    const { release } = config;
    const { scope } = release;
    const { bumpRes } = data;
    return `release${scope ? `(${scope})` : ``}: ${bumpRes?.version}`;
  },
  commitFilesCollect: async (config, data) => {
    const { release } = config;
    const {
      disableWriteVersion,
      disableWriteChangelogFile,
      pkgFilePathResolve,
      changelogFilePathResolve,
    } = release;
    const { bumpRes, changelogRes } = data;
    const files: string[] = [];
    if (!disableWriteVersion) {
      if (bumpRes?.oldVersion !== bumpRes?.version) {
        const pkgFileAbsolutePath = await pkgFilePathResolve(config);
        files.push(pkgFileAbsolutePath);
      }
    }
    if (!disableWriteChangelogFile) {
      if (!changelogRes) {
        const changelogFileAbsolutePath = await changelogFilePathResolve(
          config
        );
        files.push(changelogFileAbsolutePath);
      }
    }
    return files;
  },
  tagPrefix: "v",
  tagMessageFormat: async (config, data) => {
    const { release } = config;
    const { scope } = release;
    const { bumpRes } = data;
    return `release${scope ? `(${scope})` : ``}: ${bumpRes?.version}`;
  },
  branch: ReleaseBranchConfigDefault,
};

// TODO 实现 scope?
// 还有commit？
// 甚至 test?
export const release = async (config: FinalUserConfig) => {
  const branchResult = await branch({ config });
  if (!branchResult.checkPass) {
    return;
  }

  // TODO:检查分支是否干净
  // TODO:主分支？？？
  const { release } = config;
  const { disableWriteVersion, writeVersion } = release;
  const bumpRes = await bump(config);
  console.log({ bumpRes });
  if (!disableWriteVersion) {
    await writeVersion?.(config, bumpRes);
  }
  const changelogRes = await changelog(config);
  await commit(config, { bumpRes, changelogRes });
  await tag(config, { bumpRes, changelogRes });
};
