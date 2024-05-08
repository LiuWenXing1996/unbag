import { createFsUtils } from "../utils/fs";
import { MaybePromise } from "../utils/types";
import { v4 as uuidv4 } from "uuid";
import * as fsPromises from "node:fs/promises";
import path from "../utils/path";
import { bundleRequire } from "bundle-require";
import { genWaitCommond } from "../utils/wait-func";
import { writeWaitFuncResToFile } from "../utils/wait-func";
import concurrently from "concurrently";

export interface IParallelConfig {
  tempDir?: string;
  commands: IParallelCommand[];
}

export interface IParallelCommand {
  name: string;
  wait?: () => MaybePromise<boolean>;
  waitTimeout?: number;
  waitInterval?: number;
  npmScript: string;
}

export interface ICommand {
  command: string;
  name: string;
}

export const parallel = async (config: IParallelConfig) => {
  const waitFuncMap = new Map<string, IParallelCommand["wait"]>();
  const commands: ICommand[] = config.commands.map((e) => {
    let command = `${e.npmScript}`;
    if (e.wait) {
      const waitTag = `${e.name}_wait_${uuidv4()}`;
      const waitCmd = genWaitCommond({
        tag: waitTag,
        name: e.name,
        tempDir: config.tempDir,
        interval: e.waitInterval,
        timeout: e.waitTimeout,
      });
      command = `${waitCmd} && ${command}`;
      waitFuncMap.set(waitTag, e.wait);
    }
    return {
      name: e.name,
      command,
    };
  });
  concurrently(commands, {
    prefixColors: "auto",
    prefix: "[{time}]-[{name}]",
    timestampFormat: "HH:mm:ss",
    killOthers: ["failure"],
  });
  const waitFuncObj = Object.fromEntries(waitFuncMap.entries());
  Object.keys(waitFuncObj).map(async (tag) => {
    const func = waitFuncObj[tag];
    let res = true;
    if (func) {
      res = await func();
    }
    if (res) {
      await writeWaitFuncResToFile({
        tempDir: config.tempDir,
        tag,
        isSucess: true,
      });
    }
  });
};

export async function loadParallelConfigFromFile(options: {
  root: string;
  filePath?: string;
}): Promise<IParallelConfig | undefined> {
  const root = options.root;
  const fsUtils = createFsUtils(fsPromises);
  const configFileList = [
    "unbag.parallel.config.ts",
    "unbag.parallel.config.js",
    "unbag.parallel.config.cjs",
    "unbag.parallel.config.mjs",
  ];
  if (options.filePath) {
    configFileList.push(options.filePath);
  }
  let currentConfigFilePath: string | undefined = undefined;
  for (const configFile of configFileList) {
    const absoutePath = path.isAbsolute(configFile)
      ? configFile
      : path.join(root, configFile);
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
    format: "cjs",
  });
  const config = mod.default || mod;

  config.root = config.root || root;
  return config;
}

export const defineParallelConfig = (config: IParallelConfig) => config;
