import { IBuildConfig } from "../commands/build";
import * as fsPromises from "node:fs/promises";
import { bundleRequire } from "bundle-require";
import { createFsUtils } from "./fs";
import path from "./path";
import { join } from "node:path";

export async function loadBuildConfigFromFile(options: {
  root: string;
  filePath?: string;
}): Promise<IBuildConfig | undefined> {
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
    const absoutePath = path.isAbsolute(configFile)
      ? configFile
      : join(root, configFile);
    const isExit = await fsUtils.exists(absoutePath);
    if (isExit) {
      currentConfigFilePath = absoutePath;
      break;
    }
  }
  if (!currentConfigFilePath) {
    return undefined;
  }

  const { mod } = await bundleRequire({
    filepath: currentConfigFilePath,
  });
  const config = mod.default || mod

  config.root = config.root || root;
  return config;
}

export const defineConfig = (config: IBuildConfig) => config;
