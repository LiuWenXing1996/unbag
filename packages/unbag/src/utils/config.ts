import { ParallelConfig } from "../commands/parallel";
import { TransformConfig } from "../commands/transform";
import { createFsUtils } from "./fs";
import * as fsPromises from "node:fs/promises";
import path from "../utils/path";
import { bundleRequire } from "bundle-require";
import { ReleaseConfig } from "../commands/release";
import { arraify, isObject } from "./common";

export interface Config {
  transform?: TransformConfig;
  parallel?: ParallelConfig;
  release?: ReleaseConfig;
}

export const defineConfig = (config: Config) => config;

export async function loadConfigFromFile(options: {
  root: string;
  filePath?: string;
}): Promise<Config | undefined> {
  const root = options.root;
  const fsUtils = createFsUtils(fsPromises);
  const configFileList = [
    "unbag.config.ts",
    "unbag.config.js",
    "unbag.config.cjs",
    "unbag.config.mjs",
  ];
  if (options.filePath) {
    configFileList.push(options.filePath);
  }
  let currentConfigFilePath: string | undefined = undefined;
  for (const configFile of configFileList) {
    const absolutePath = path.isAbsolute(configFile)
      ? configFile
      : path.join(root, configFile);
    const isExit = await fsUtils.exists(absolutePath);
    if (isExit) {
      currentConfigFilePath = absolutePath;
      break;
    }
  }
  if (!currentConfigFilePath) {
    return undefined;
  }

  const { mod } = await bundleRequire({
    filepath: currentConfigFilePath,
    format: "cjs",
  });
  const config = mod.default || mod;

  config.root = config.root || root;
  return config;
}

export const mergeConfig = <
  T extends Record<string, any> = Record<string, any>
>(
  defaults: T,
  overrides: Partial<T>
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
