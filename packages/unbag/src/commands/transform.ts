import { IPluginInputFile, IPluginTree, execPluginTree } from "../utils/plugin";
import path from "../utils/path";
import { createFsUtils } from "../utils/fs";
import * as fsPromises from "node:fs/promises";
import { MaybePromise } from "../utils/types";
import { bundleRequire } from "bundle-require";
import { arraify, isObject } from "../utils/common";

export interface IPlugin {
  name: string;
}

export interface ITransformConfig {
  entry: string;
  root?: string;
  sourcemap?: boolean;
  plugins: IPluginTree;
  filterFile?: (
    filePath: string,
    options: {
      oldFilterFile: (filepath: string) => Promise<boolean>;
    }
  ) => MaybePromise<boolean>;
  readFile?: (
    filePath: string,
    options: {
      oldReadFile: (filepath: string) => Promise<string | Buffer>;
    }
  ) => MaybePromise<string | Buffer>;
  codeFileTypes?: string[];
  excludeFileTypes?: string[];
}

const defaultFilterFile = async (filepath: string) => {
  const needIgnore = KNOWN_EXCLUDE_FILE_TYPES.filter((e) => e).some((f) =>
    filepath.endsWith(f)
  );
  return !needIgnore;
};

const defaultReadFile = async (filepath: string) => {
  const readToString = KNOWN_CODE_FILE_TYPES.filter((e) => e).some((f) =>
    filepath.endsWith(f)
  );
  if (readToString) {
    return await fsPromises.readFile(filepath, "utf-8");
  }
  return await fsPromises.readFile(filepath);
};

export const KNOWN_EXCLUDE_FILE_TYPES = [".DS_Store"];
export const KNOWN_CODE_FILE_TYPES = [
  ".mjs",
  ".js",
  ".mts",
  ".ts",
  ".jsx",
  ".tsx",
  ".json",
  ".css",
  ".less",
  ".sass",
  ".scss",
  ".styl",
  ".stylus",
  ".pcss",
  ".postcss",
  ".vue",
  ".svg",
];

export const resolveTransformEntry = (config: ITransformConfig) => {
  const root = config.root || process.cwd();
  const configEntry = config.entry;
  const entry = path.isAbsolute(configEntry)
    ? configEntry
    : path.join(root, configEntry);
  return entry;
};

export const transform = async (config: ITransformConfig) => {
  const root = config.root || process.cwd();
  const entry = resolveTransformEntry(config);
  const filterFile = async (filePath: string) => {
    if (config.filterFile) {
      return await config.filterFile(filePath, {
        oldFilterFile: defaultFilterFile,
      });
    }
    return await defaultFilterFile(filePath);
  };
  const readFile = async (filePath: string) => {
    if (config.readFile) {
      return await config.readFile(filePath, {
        oldReadFile: defaultReadFile,
      });
    }
    return await defaultReadFile(filePath);
  };
  const fs = createFsUtils(fsPromises);
  let entryFiles = await fs.listFiles(entry);
  entryFiles = (
    await Promise.all(
      entryFiles.map(async (e) => {
        const needIgnore = !(await filterFile(e));
        if (needIgnore) {
          return undefined;
        }
        return e;
      })
    )
  ).filter((e) => e) as string[];
  const inputFiles: IPluginInputFile[] = await Promise.all(
    entryFiles.map(async (entryFilePath) => {
      const content = await readFile(entryFilePath);
      return {
        path: path.relative(entry, entryFilePath),
        content,
      };
    })
  );
  await execPluginTree(config.plugins, {
    inputFiles: [...inputFiles],
    writeFiles: async (files, outputPath) => {
      const absolutePath = path.isAbsolute(outputPath)
        ? outputPath
        : path.join(root, outputPath);
      await fs.remove(absolutePath);
      await Promise.all(
        files.map(async (file) => {
          const outputFilePath = path.join(absolutePath, file.path);
          await fs.outputFile(outputFilePath, file.content);
          if (config.sourcemap) {
            if (file.sourcemap) {
              await fs.outputFile(outputFilePath + ".map", file.sourcemap);
            }
          }
        })
      );
    },
    transformConfig: { ...config },
  });
};

export async function loadTransformConfigFromFile(options: {
  root: string;
  filePath?: string;
}): Promise<ITransformConfig | undefined> {
  const root = options.root;
  const fsUtils = createFsUtils(fsPromises);
  const configFileList = [
    "unbag.transform.config.ts",
    "unbag.transform.config.js",
    "unbag.transform.config.cjs",
    "unbag.transform.config.mjs",
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

export const defineTransformConfig = (config: ITransformConfig) => config;

export const mergeConfig = (
  defaults: ITransformConfig,
  overrides: Partial<ITransformConfig>
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
