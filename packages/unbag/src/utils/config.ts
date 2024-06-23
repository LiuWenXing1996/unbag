import { ParallelConfig, parallelDefaultConfig } from "../commands/parallel";
import { TransformConfig, transformDefaultConfig } from "../commands/transform";
import { createFsUtils } from "./fs";
import * as fsPromises from "node:fs/promises";
import path, { PathConfig, PathConfigDefault } from "../utils/path";
import { bundleRequire } from "bundle-require";
import { ReleaseConfig, releaseDefaultConfig } from "../commands/release";
import { arraify, isObject, safeObj, wrapperZodLazyResult } from "./common";
import { message } from "./message";
import { DeepPartial } from "./types";
import { LogConfig, LogConfigSchema } from "./log";
import { GitConfig, GitConfigDefault } from "./git";
import { z } from "zod";
import { defineConfigSchema } from "./schema";

export interface FinalUserConfig {
  root: string;
  // configFileResolvedPath?: string;
  // git: GitConfig;
  // path: PathConfig;
  // tempDir: string;
  log: LogConfig;
  // transform: TransformConfig;
  // parallel: ParallelConfig;
  // release: ReleaseConfig;
}

export const FinalUserConfigSchema: z.ZodSchema<FinalUserConfig> = z.lazy(() =>
  wrapperZodLazyResult(
    z
      .object({
        root: z.string().default("() => process.cwd()"),
        log: LogConfigSchema.default(LogConfigSchema.parse({})),
      })
      .default({})
  )
);
// defineConfigSchema<FinalUserConfig>(() => {
//   return z
//     .object({
//       // root: z.string().default("() => process.cwd()"),
//       log: LogConfigSchema,
//     })
//     .default({});
// });
export type UserConfig = DeepPartial<
  Omit<FinalUserConfig, "configFileResolvedPath" | "root">
>;

export const defaultConfig: FinalUserConfig = {
  root: process.cwd(),
  git: GitConfigDefault,
  path: PathConfigDefault,
  tempDir: "./node_modules/.unbag",
  log: logDefaultConfig,
  transform: transformDefaultConfig,
  parallel: parallelDefaultConfig,
  release: releaseDefaultConfig,
};

export const defineUserConfig = (config: UserConfig) => config;
export const resolveUserConfig = async (options: {
  root: string;
  filePath?: string;
}) => {
  const { filePath, root } = options;
  const fsUtils = createFsUtils(fsPromises);

  if (filePath) {
    const absoluteFilePath = path.isAbsolute(filePath)
      ? filePath
      : path.join(root, filePath);
    const isExit = await fsUtils.exists(absoluteFilePath);
    if (!isExit) {
      throw new Error(message.configPropertyUndefined(absoluteFilePath));
    }
    return await loadUserConfigFromFile(absoluteFilePath);
  } else {
    const configFileDefaultList = [
      "unbag.config.ts",
      "unbag.config.js",
      "unbag.config.cjs",
      "unbag.config.mjs",
    ];
    for (const filePath of configFileDefaultList) {
      const absoluteFilePath = path.isAbsolute(filePath)
        ? filePath
        : path.join(root, filePath);
      const isExit = await fsUtils.exists(absoluteFilePath);
      if (!isExit) {
        break;
      }
      return await loadUserConfigFromFile(absoluteFilePath);
    }
  }
};

export async function loadUserConfigFromFile(absoluteFilePath: string): Promise<
  | (UserConfig & {
      configFileResolvedPath: string;
    })
  | undefined
> {
  const { mod } = await bundleRequire({
    filepath: absoluteFilePath,
    format: "cjs",
  });
  const config = mod.default || mod;
  config.configFileResolvedPath = absoluteFilePath;
  return config;
}

export const mergeDefaultConfig = (userConfig?: UserConfig) => {
  return mergeConfig(defaultConfig, userConfig || {});
};

export const mergeConfig = <
  T extends Record<string, any> = Record<string, any>
>(
  defaults: T,
  overrides: DeepPartial<T>
) => {
  return mergeConfigRecursively(defaults, overrides);
};

export const mergeConfigRecursively = <
  T extends Record<string, any> = Record<string, any>
>(
  defaults: T,
  overrides: Partial<T>
): T => {
  const merged: T = { ...defaults };
  for (const key in overrides) {
    const value = overrides[key];
    if (value == null) {
      continue;
    }

    const existing = merged[key];

    if (existing == null) {
      merged[key] = value;
      continue;
    }

    if (Array.isArray(existing) || Array.isArray(value)) {
      merged[key] = [
        ...arraify(existing ?? []),
        ...arraify(value ?? []),
      ] as any;
      continue;
    }
    if (isObject(existing) && isObject(value)) {
      merged[key] = mergeConfigRecursively(existing, value);
      continue;
    }

    merged[key] = value;
  }
  return merged;
};

export const checkUserConfig = () => {
  // TODO:使用 zod 来校验用户设置
};

export const safeConfig = <T extends object>(
  config: T,
  configVarName: string,
  configPath?: string
) => {
  return safeObj(config, configVarName, {
    errorMsgFormat: (objName, key) => {
      const keyPath = `${objName}.${key}`;
      const msg = message.configPropertyUndefined(keyPath, configPath);
      return msg;
    },
  });
};
