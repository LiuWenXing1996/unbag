import { MaybePromise } from "../../utils/types";
import path from "node:path";
import fs from "node:fs/promises";
import { mergeConfig } from "../../utils/config";
import { type ReleaseType } from "semver";
import { BumpResult, bump } from "./bump";
import { message } from "../../utils/message";
import { createFsUtils } from "../../utils/fs";

export interface ReleaseConfigPkgFileContent {
  version: string;
}

export interface ReleaseConfig {
  pkgFilePath?: string;
  readPkgFile?: (
    config?: ReleaseConfig
  ) => MaybePromise<ReleaseConfigPkgFileContent>;
  disableWriteVersion?: boolean;
  writeVersion?: (
    config?: ReleaseConfig,
    bumpRes?: BumpResult
  ) => MaybePromise<void>;
  releaseAs?: string;
  releaseType?: ReleaseType;
  releasePre?: boolean;
  releasePreTag?: string;
  tagPrefix?: string;
  scope?: string;
}

export const ReleaseConfigDefaults: ReleaseConfig = {
  pkgFilePath: "package.json",
  readPkgFile: async (config = {}) => {
    const { pkgFilePath } = config;
    if (!pkgFilePath) {
      throw new Error(message.releaseUndefinedPkgFileConfig());
    }
    const pkgPath = path.resolve(process.cwd(), pkgFilePath);
    const fsUtils = createFsUtils(fs);
    const content = await fsUtils.readJson<ReleaseConfigPkgFileContent>(
      pkgPath
    );
    return content;
  },
  writeVersion: async (config = {}, bumpRes) => {
    const { pkgFilePath } = config;
    if (!pkgFilePath) {
      throw new Error(message.releaseUndefinedPkgFileConfig());
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
  tagPrefix: "v",
};

// TODO 实现 scope?
// 还有commit？
// 甚至 test?
export const release = async (config: ReleaseConfig = {}) => {
  const { disableWriteVersion, writeVersion } = config;
  const bumpRes = await bump(config);
  if (!disableWriteVersion) {
    await writeVersion?.(config, bumpRes);
  }
  
};

export const releaseWithConfigDefaults = async (config?: ReleaseConfig) => {
  const mergedConfig = mergeConfig(ReleaseConfigDefaults, config || {});
  return await release(mergedConfig);
};
