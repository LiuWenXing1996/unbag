import {
  TransformPluginInputFile,
  TransformPluginTree,
  TransformPluginTreeSchema,
  execTransformPluginTree,
} from "./plugin";
import path from "../../utils/path";
import { createFsUtils } from "../../utils/fs";
import * as fsPromises from "node:fs/promises";
import { MaybePromise } from "../../utils/types";
import { FinalUserConfig } from "../../utils/config";
import { watch as fsWatch } from "chokidar";
import debounce from "debounce-promise";
import { z } from "zod";
import {
  defineZodFunctionWithDefault,
  wrapperZodLazyResult,
} from "../../utils/common";

export interface TransformConfig {
  entry: string;
  watch: boolean;
  sourcemap: boolean;
  plugins: TransformPluginTree;
  filterFile: (filePath: string) => Promise<boolean>;
  readFile: (filePath: string) => Promise<string | Buffer>;
}

export const TransformConfigSchema: z.ZodSchema<TransformConfig> = z.lazy(() =>
  wrapperZodLazyResult(
    z
      .object({
        entry: z.string().default("./src"),
        watch: z.boolean().default(false),
        sourcemap: z.boolean().default(false),
        plugins: TransformPluginTreeSchema,
        filterFile: defineZodFunctionWithDefault(
          z.function().args(z.string()).returns(z.promise(z.boolean())),
          async (filepath) => {
            const needIgnore = KNOWN_EXCLUDE_FILE_TYPES.filter((e) => e).some(
              (f) => filepath.endsWith(f)
            );
            return !needIgnore;
          }
        ),
        readFile: defineZodFunctionWithDefault(
          z
            .function()
            .args(z.string())
            .returns(z.promise(z.union([z.string(), z.instanceof(Buffer)]))),
          async (filepath) => {
            const readToString = KNOWN_CODE_FILE_TYPES.filter((e) => e).some(
              (f) => filepath.endsWith(f)
            );
            if (readToString) {
              return await fsPromises.readFile(filepath, "utf-8");
            }
            return await fsPromises.readFile(filepath);
          }
        ),
      })
      .default({})
  )
);

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

export const resolveTransformEntry = (config: FinalUserConfig) => {
  const { root, transform } = config;
  const { entry, sourcemap } = transform;
  const finalEntry = path.isAbsolute(entry) ? entry : path.join(root, entry);
  return finalEntry;
};

export const innerTransform = async (config: FinalUserConfig) => {
  const { root, transform } = config;
  const { filterFile, readFile, plugins, sourcemap } = transform;
  const entry = resolveTransformEntry(config);
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
  const inputFiles: TransformPluginInputFile[] = await Promise.all(
    entryFiles.map(async (entryFilePath) => {
      const content = await readFile(entryFilePath);
      return {
        path: path.relative(entry, entryFilePath),
        content,
      };
    })
  );
  await execTransformPluginTree(plugins, {
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
          if (sourcemap) {
            if (file.sourcemap) {
              await fs.outputFile(outputFilePath + ".map", file.sourcemap);
            }
          }
        })
      );
    },
    finalUserConfig: { ...config },
  });
};

export const watch = async (config: FinalUserConfig) => {
  const entry = resolveTransformEntry(config);
  const watcher = fsWatch(entry);
  const debouncedTransform = debounce(async () => {
    await innerTransform(config);
  }, 100);
  await debouncedTransform();
  watcher.on("all", async (type, file) => {
    console.log("检测到变化，正在重新转换文件...");
    await debouncedTransform();
    console.log("文件转换完成");
  });
  console.log("观察模式已启动");
};

export const transform = async (config: FinalUserConfig) => {
  if (config.transform.watch) {
    await watch(config);
  } else {
    return innerTransform(config);
  }
};
