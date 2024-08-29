import { ParallelConfig, ParallelDefaultConfig } from "../commands/parallel";
import { TransformConfig, TransformConfigDefault } from "../commands/transform";
import { useFs } from "./fs";
import { AbsolutePath, usePath } from "../utils/path";
import { bundleRequire } from "bundle-require";
import { ReleaseConfig, releaseDefaultConfig } from "../commands/release";
import { arraify, filterNullable, isObject, Locale, safeObj } from "./common";
import { useMessage } from "./message";
import { DeepPartial, DeepReadonly } from "./types";
import { LogConfig, LogConfigDefault } from "./log";
import deepFreezeStrict from "deep-freeze-strict";
import _ from "lodash";
import { CommitConfig, CommitConfigDefault } from "@/commands/commit/config";
export type UserConfig = {
  root: string;
  locale: Locale;
  configFileResolvedPath?: string;
  tempDir: string;
  log: LogConfig;
  transform: TransformConfig;
  parallel: ParallelConfig;
  release: ReleaseConfig;
  commit: CommitConfig;
};
export type FinalUserConfig = DeepReadonly<UserConfig>;
export type UserConfigOptional = DeepPartial<
  Omit<UserConfig, "configFileResolvedPath">
>;
// export type UserConfigOptional = DeepPartial<Omit<UserConfig, "configFileResolvedPath">>;
export const useDefaultConfig = () => {
  const defaultConfig: UserConfig = {
    root: process.cwd(),
    locale: Locale.zh_cn,
    tempDir: "./node_modules/.unbag",
    log: LogConfigDefault,
    transform: TransformConfigDefault,
    parallel: ParallelDefaultConfig,
    release: releaseDefaultConfig,
    commit: CommitConfigDefault,
  };
  return defaultConfig;
};
export const defineUserConfig = (config: UserConfigOptional) => config;
export const resolveUserConfig = async (options: {
  root: AbsolutePath;
  filePath?: string;
  locale: Locale;
}) => {
  const { filePath, root, locale } = options;
  const fsUtils = useFs();
  const path = usePath();
  const message = useMessage({
    locale,
  });
  if (filePath) {
    const absoluteFilePath = path.resolve(root.content, filePath);
    const isExit = await fsUtils.exists(absoluteFilePath);
    if (!isExit) {
      throw new Error(message.config.file.notFound(absoluteFilePath));
    }
    return await loadUserConfigFromFile(
      new AbsolutePath({
        content: absoluteFilePath,
      })
    );
  } else {
    const configFileDefaultList = [
      "unbag.config.ts",
      "unbag.config.js",
      "unbag.config.cjs",
      "unbag.config.mjs",
    ];
    for (const filePath of configFileDefaultList) {
      const absoluteFilePath = path.resolve(root.content, filePath);
      const isExit = await fsUtils.exists(absoluteFilePath);
      if (!isExit) {
        break;
      }
      return await loadUserConfigFromFile(
        new AbsolutePath({
          content: absoluteFilePath,
        })
      );
    }
  }
};
export async function loadUserConfigFromFile(
  absoluteFilePath: AbsolutePath
): Promise<
  | (UserConfigOptional & {
      configFileResolvedPath: string;
    })
  | undefined
> {
  const { mod } = await bundleRequire({
    filepath: absoluteFilePath.content,
    format: "esm",
  });
  const config = mod.default || mod;
  config.configFileResolvedPath = absoluteFilePath;
  return config;
}
export const mergeDefaultConfig = (userConfig?: UserConfigOptional) => {
  const defaultConfig = useDefaultConfig();
  return mergeConfig(defaultConfig, userConfig || {});
};
export const mergeConfig = <T, D extends DeepPartial<T>>(
  defaults: T,
  overrides: D
) => {
  const customize = (objValue: any, srcValue: any) => {
    if (_.isArray(objValue) || _.isArray(srcValue)) {
      return filterNullable([...arraify(objValue), ...arraify(srcValue)]);
    }
  };
  return _.mergeWith({}, defaults, overrides, customize) as T;
};
// export const mergeConfigRecursively = <
//   T extends Record<string, any> = Record<string, any>
// >(
//   defaults: T,
//   overrides: Partial<T>
// ): T => {
//   const merged: T = {
//     ...defaults,
//   };
//   for (const key in overrides) {
//     const value = overrides[key];
//     if (value == null) {
//       continue;
//     }
//     const existing = merged[key];
//     if (existing == null) {
//       merged[key] = value;
//       continue;
//     }
//     if (Array.isArray(existing) || Array.isArray(value)) {
//       merged[key] = [
//         ...arraify(existing ?? []),
//         ...arraify(value ?? []),
//       ] as any;
//       continue;
//     }
//     if (isObject(existing) && isObject(value)) {
//       merged[key] = mergeConfigRecursively(existing, value);
//       continue;
//     }
//     merged[key] = value;
//   }
//   return merged;
// };
// export const safeConfig = <T extends object>(
//   config: T,
//   configVarName: string,
//   configPath?: string
// ) => {
//   return safeObj(config, configVarName, {
//     errorMsgFormat: (objName, key) => {
//       const keyPath = `${objName}.${key}`;
//       const msg = message.configPropertyUndefined(keyPath, configPath);
//       return msg;
//     },
//   });
// };

export const deepFreezeConfig = (userConfig: UserConfig) => {
  return deepFreezeStrict(userConfig) as FinalUserConfig;
};
