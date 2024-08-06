import { useFs } from "./../../utils/fs";
import { filterNullable, useRoot } from "./../../utils/common";
import { FinalUserConfig } from "./../../utils/config";
import { useLog } from "./../../utils/log";
import { DeepReadonly, MaybePromise } from "./../../utils/types";
import _ from "lodash";
import { AbsolutePath, RelativePath, usePath } from "./../../utils/path";
export enum TransformPluginOutputFileType {
  "Transformed" = "Transformed",
  "Copy" = "Copy",
  "Ignored" = "Ignored",
}
export type TransformPluginOutputFile = {
  from: RelativePath;
} & (
  | {
      type: TransformPluginOutputFileType.Transformed;
      to: RelativePath;
      content: string | Buffer;
      sourcemap?: string;
    }
  | {
      type: TransformPluginOutputFileType.Copy;
      to: RelativePath;
    }
  | {
      type: TransformPluginOutputFileType.Ignored;
    }
);
export type ExecTransformPluginPaths = {
  index: number;
  name: string;
}[];
export enum TransformPluginType {
  "All" = "All",
  "Single" = "Single",
}
export type TransformPlugin = {
  name: string;
  transform: (params: {
    inputDir: AbsolutePath;
    filePaths: RelativePath[];
    finalUserConfig: FinalUserConfig;
  }) => Promise<(TransformPluginOutputFile | undefined)[]>;
  // TODO:这个是不是可以去掉？
  // match: (params: {
  //   filePath: RelativePath;
  //   inputDir: AbsolutePath;
  // }) => Promise<boolean>;
};
// & (
//   | {
//       type: TransformPluginType.All;
//       transform: (params: {
//         inputDir: AbsolutePath;
//         matchedFilePaths: RelativePath[];
//         ignoredFilePaths: RelativePath[];
//         finalUserConfig: FinalUserConfig;
//       }) => Promise<
//         TransformPluginOutputFile | TransformPluginOutputFile[] | undefined
//       >;
//     }
//   | {
//       type: TransformPluginType.Single;
//       transform: (params: {
//         inputDir: AbsolutePath;
//         matchedFilePaths: RelativePath[];
//         ignoredFilePaths: RelativePath[];
//         currentFilePath: RelativePath;
//         finalUserConfig: FinalUserConfig;
//       }) => Promise<
//         TransformPluginOutputFile | TransformPluginOutputFile[] | undefined
//       >;
//     }
// );

export const defineTransformPlugin = (p: TransformPlugin) => p;
export interface TransformPluginTreeNodeConfig {
  output?: string;
  extend?: (plugin: TransformPlugin) => MaybePromise<TransformPlugin>;
}
export type TransformPluginTree = TransformPluginTreeNode[];
export interface TransformPluginTreeNode {
  config?: TransformPluginTreeNodeConfig;
  plugin: TransformPlugin;
  children?: TransformPluginTreeNode[];
}
export type TransformPluginWriteFileFunc = (
  files: TransformPluginOutputFile[],
  outputPath: string
) => Promise<void>;
const genTransformPluginTempDir = (params: {
  transformTempDir: AbsolutePath;
  execTransformPluginPaths: ExecTransformPluginPaths;
  currentTransformPlugin: {
    index: number;
    name: string;
  };
}) => {
  const { transformTempDir, execTransformPluginPaths, currentTransformPlugin } =
    params;
  const relativeParentPath = execTransformPluginPaths
    .map(({ index, name }) => `${index}-${name}/children`)
    .join("/");
  const path = usePath();
  const absolutePath = path.resolve(
    transformTempDir.content,
    relativeParentPath,
    `${currentTransformPlugin.index}-${currentTransformPlugin.name}/content`
  );
  return new AbsolutePath({
    content: absolutePath,
  });
};
export const execTransformPluginNode = async (params: {
  node: DeepReadonly<TransformPluginTreeNode>;
  index: number;
  inputDir: AbsolutePath;
  transformTempDir: AbsolutePath;
  execTransformPluginPaths: ExecTransformPluginPaths;
  finalUserConfig: FinalUserConfig;
}) => {
  const {
    node,
    finalUserConfig,
    inputDir,
    execTransformPluginPaths,
    transformTempDir,
    index,
  } = params;
  const { plugin, children, config } = node;
  const fs = useFs();
  const path = usePath();
  const log = useLog({
    finalUserConfig,
  });
  const startTime = Date.now();
  log.info(`${startTime} 正在处理插件${plugin.name}...`);
  const finalPlugin = config?.extend ? await config.extend(plugin) : plugin;
  const inputFilePaths = (await fs.listFiles(inputDir.content))
    .map((e) => {
      return new AbsolutePath({
        content: e,
      });
    })
    .map((e) => {
      return e.toRelativePath({
        rel: inputDir,
      });
    });
  const inputFilePathsFiltered = filterNullable(
    await Promise.all(
      inputFilePaths.map(async (filePath) => {
        const matched = await finalUserConfig.transform.match({
          filePath,
          inputDir,
          finalUserConfig,
        });
        if (matched) {
          return filePath;
        }
      })
    )
  );
  const tempOutDir = genTransformPluginTempDir({
    execTransformPluginPaths,
    transformTempDir,
    currentTransformPlugin: {
      index,
      name: finalPlugin.name,
    },
  });
  const outputFiles = filterNullable(
    await plugin.transform({
      finalUserConfig,
      inputDir,
      filePaths: [...inputFilePathsFiltered],
    })
  );
  await fs.ensureDir(tempOutDir.content);
  await Promise.all(
    outputFiles.map(async (file) => {
      if (file.type === TransformPluginOutputFileType.Ignored) {
        return;
      }
      if (file.type === TransformPluginOutputFileType.Copy) {
        await fs.copy(
          path.resolve(inputDir.content, file.from.content),
          path.resolve(tempOutDir.content, file.to.content)
        );
      }
      if (file.type === TransformPluginOutputFileType.Transformed) {
        await fs.outputFile(
          path.resolve(tempOutDir.content, file.to.content),
          file.content
        );
      }
    })
  );
  log.info(`${Date.now() - startTime} 处理插件完成${plugin.name}...`);
  if (config?.output) {
    const rootPath = useRoot({ finalUserConfig });
    const outputDir = rootPath.resolve({
      next: config.output,
    });
    await fs.emptyDir(outputDir.content);
    await fs.copy(tempOutDir.content, outputDir.content);
  }
  if (children && children.length > 0) {
    log.info(`处理插件子项${plugin.name}...`);
    await execTransformPluginNodeChildren({
      children,
      inputDir: tempOutDir,
      transformTempDir,
      finalUserConfig,
      execTransformPluginPaths: [
        ...execTransformPluginPaths,
        {
          index,
          name: plugin.name,
        },
      ],
    });
  }
  return [...outputFiles];
};
export const execTransformPluginNodeChildren = async (params: {
  children: DeepReadonly<TransformPluginTreeNode[]>;
  inputDir: AbsolutePath;
  transformTempDir: AbsolutePath;
  execTransformPluginPaths: ExecTransformPluginPaths;
  finalUserConfig: FinalUserConfig;
}) => {
  const { children, ...rest } = params;
  await Promise.all(
    children.map(async (treeNode, index) => {
      return await execTransformPluginNode({
        index,
        node: treeNode,
        ...rest,
      });
    })
  );
};
export const execTransformPluginTree = async (params: {
  tree: DeepReadonly<TransformPluginTree>;
  inputDir: AbsolutePath;
  transformTempDir: AbsolutePath;
  finalUserConfig: FinalUserConfig;
}) => {
  const { tree, ...rest } = params;
  await execTransformPluginNodeChildren({
    children: tree,
    execTransformPluginPaths: [],
    ...rest,
  });
};
