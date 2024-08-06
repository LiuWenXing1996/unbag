import { FinalUserConfig } from "@/utils/config";
import { AbsolutePath, RelativePath, usePath } from "@/utils/path";
import { useTransformEntry, useTransformFiles } from "../utils";
import {
  TransformActionProcessUid,
  useTransformActionProcessMap,
} from "./process";
import { useFs } from "@/utils/fs";
import {
  TransformActionTaskEsbuild,
  TransformActionTaskEsbuildOptions,
} from "./tasks/esbuild";
import {
  TransformActionTaskAlias,
  TransformActionTaskAliasOptions,
} from "./tasks/alias";
import {
  TransformActionTaskBabel,
  TransformActionTaskBabelOptions,
} from "./tasks/babel";
import { useRoot } from "@/utils/common";
import { DeepPartial } from "@/utils/types";

export type TransformActionTaskOutFile = {
  from: RelativePath;
} & (
  | {
      type: TransformActionTaskOutFileType.Transformed;
      to: RelativePath;
      content: string | Buffer;
      sourcemap?: string;
    }
  | {
      type: TransformActionTaskOutFileType.Copy;
      to: RelativePath;
    }
  | {
      type: TransformActionTaskOutFileType.Ignored;
    }
);
export enum TransformActionTaskOutFileType {
  "Transformed" = "Transformed",
  "Copy" = "Copy",
  "Ignored" = "Ignored",
}
export type TransformActionTaskResult = (
  | TransformActionTaskOutFile
  | undefined
)[];

export type TransformActionTask = (params: {
  inputDir: AbsolutePath;
  tempDir: AbsolutePath;
  filePaths: RelativePath[];
  finalUserConfig: FinalUserConfig;
}) => Promise<TransformActionTaskResult>;
export const defineTransformActionTask = (task: TransformActionTask) => task;

export type TransformActionHelper = ReturnType<typeof useTransformActionHelper>;

export const useTransformActionHelper = (params: {
  finalUserConfig: FinalUserConfig;
}) => {
  const { finalUserConfig } = params;
  const entryDir = useTransformEntry({ finalUserConfig });
  const fs = useFs();
  const path = usePath();
  const { createProcess, getProcessTempDir } = useTransformActionProcessMap({
    finalUserConfig,
  });
  const custom = async (params: {
    name: string;
    task: TransformActionTask;
    parentUid?: TransformActionProcessUid;
  }) => {
    const { name, task, parentUid } = params;
    const uid = await createProcess({
      name,
      task: async ({ tempDir }) => {
        const inputDir = parentUid
          ? getProcessTempDir({ uid: parentUid })
          : entryDir;
        const filePaths = await useTransformFiles({
          finalUserConfig,
          inputDir,
        });
        const result = await task({
          tempDir,
          inputDir,
          filePaths,
          finalUserConfig,
        });
        await fs.ensureDir(tempDir.content);
        await Promise.all(
          result.map(async (file) => {
            if (!file) {
              return;
            }
            if (file.type === TransformActionTaskOutFileType.Ignored) {
              return;
            }
            if (file.type === TransformActionTaskOutFileType.Copy) {
              await fs.copy(
                path.resolve(inputDir.content, file.from.content),
                path.resolve(tempDir.content, file.to.content)
              );
            }
            if (file.type === TransformActionTaskOutFileType.Transformed) {
              await fs.outputFile(
                path.resolve(tempDir.content, file.to.content),
                file.content
              );
            }
          })
        );
      },
    });
    return uid;
  };
  const esbuild = async (params: {
    name: string;
    options: TransformActionTaskEsbuildOptions;
    parentUid?: TransformActionProcessUid;
  }) => {
    const { name, options, parentUid } = params;
    return await custom({
      name,
      task: TransformActionTaskEsbuild(options),
      parentUid,
    });
  };
  const babel = async (params: {
    name: string;
    options: TransformActionTaskBabelOptions;
    parentUid?: TransformActionProcessUid;
  }) => {
    const { name, options, parentUid } = params;
    return await custom({
      name,
      task: TransformActionTaskBabel(options),
      parentUid,
    });
  };
  const alias = async (params: {
    name: string;
    options: DeepPartial<TransformActionTaskAliasOptions>;
    parentUid?: TransformActionProcessUid;
  }) => {
    const { name, options, parentUid } = params;
    return await custom({
      name,
      task: TransformActionTaskAlias(options),
      parentUid,
    });
  };
  const merge = async (params: {
    name: string;
    processUidList: TransformActionProcessUid[];
  }) => {
    const { name, processUidList } = params;
    const uid = await createProcess({
      name,
      task: async ({ tempDir }) => {
        const inputDirList = processUidList.map((uid) =>
          getProcessTempDir({ uid })
        );
        for (const inputDir of inputDirList) {
          await fs.copy(inputDir.content, tempDir.content);
        }
      },
    });
    return uid;
  };
  const out = async (params: {
    output: string;
    processUid: TransformActionProcessUid;
  }) => {
    const { output, processUid } = params;
    // TODO:check output valid
    const tempDir = getProcessTempDir({ uid: processUid });
    const rootPath = useRoot({ finalUserConfig });
    const outputDir = rootPath.resolve({
      next: output,
    });
    await fs.emptyDir(outputDir.content);
    await fs.copy(tempDir.content, outputDir.content);
  };
  return {
    custom,
    merge,
    esbuild,
    alias,
    babel,
    out,
  };
};
