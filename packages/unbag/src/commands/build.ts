import {
  ITransferInputFile,
  ITransferTree,
  execTransferTree,
} from "../utils/transfer";
import path from "../utils/path";
import { createFsUtils } from "../utils/fs";
import * as fsPromises from "node:fs/promises";

export interface IPlugin {
  name: string;
}

export interface IBuildConfig {
  entry: string;
  root?: string;
  sourcemap?: boolean;
  transfers: ITransferTree;
}

export const build = async (config: IBuildConfig) => {
  const root = config.root || process.cwd();
  const entry = path.isAbsolute(config.entry)
    ? config.entry
    : path.join(root, config.entry);
  const fs = createFsUtils(fsPromises);
  const entryFiles = await fs.listFiles(entry);
  const inputFiles: ITransferInputFile[] = await Promise.all(
    entryFiles.map(async (entryFilePath) => {
      const content = await fs.readFile(entryFilePath, "utf-8");
      return {
        path: path.relative(entry, entryFilePath),
        content,
      };
    })
  );
  await execTransferTree(config.transfers, {
    inputFiles: [...inputFiles],
    writeFiles: async (files, outputPath) => {
      const absoutePath = path.isAbsolute(outputPath)
        ? outputPath
        : path.join(root, outputPath);
      await fs.remove(absoutePath);
      await Promise.all(
        files.map(async (file) => {
          const outputFilePath = path.join(absoutePath, file.path);
          await fs.outputFile(outputFilePath, file.content);
          if (config.sourcemap) {
            if (file.sourcemap) {
              await fs.outputFile(outputFilePath + ".map", file.sourcemap);
            }
          }
        })
      );
    },
    helper: {
      path,
      fs,
    },
  });
};
