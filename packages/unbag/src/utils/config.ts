import { ParallelConfig } from "../commands/parallel";
import { TransformConfig } from "../commands/transform";
import { createFsUtils } from "./fs";
import * as fsPromises from "node:fs/promises";
import path from "../utils/path";
import { bundleRequire } from "bundle-require";

export interface Config {
  transform?: TransformConfig;
  parallel?: ParallelConfig;
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
