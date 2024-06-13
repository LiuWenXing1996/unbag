import { MaybePromise } from "../../utils/types";
import { filterNullable } from "../../utils/common";
import { FinalUserConfig } from "../../utils/config";

export interface TransformPluginInputFile {
  path: string;
  content: string | Buffer;
  sourcemap?: string;
}
export interface TransformPluginOutputFile {
  path: string;
  content: string | Buffer;
  sourcemap?: string;
}

export type TransformPlugin = {
  name: string;
  match: (
    file: TransformPluginInputFile,
    pluginConfig: TransformPluginTreeNodeConfig
  ) => MaybePromise<boolean>;
  beforeTransform?: (
    input: TransformPluginInputFile[],
    finalUserConfig: FinalUserConfig,
    pluginConfig?: TransformPluginTreeNodeConfig
  ) => MaybePromise<
    TransformPluginOutputFile | TransformPluginOutputFile[] | undefined
  >;
  transform?: (
    input: TransformPluginInputFile,
    finalUserConfig: FinalUserConfig,
    pluginConfig?: TransformPluginTreeNodeConfig
  ) => MaybePromise<
    TransformPluginOutputFile | TransformPluginOutputFile[] | undefined
  >;
  afterTransform?: (
    input: TransformPluginInputFile[],
    finalUserConfig: FinalUserConfig,
    pluginConfig?: TransformPluginTreeNodeConfig
  ) => MaybePromise<
    TransformPluginOutputFile | TransformPluginOutputFile[] | undefined
  >;
};

export const defineTransformPlugin = (p: TransformPlugin) => p;

export interface TransformPluginTreeNodeConfig {
  output?: string;
  match?: (
    file: TransformPluginInputFile,
    pluginConfig?: TransformPluginTreeNodeConfig,
    pluginMatch?: TransformPlugin["match"]
  ) => MaybePromise<boolean>;
}

const toFileArray = (
  res:
    | TransformPluginOutputFile
    | (TransformPluginOutputFile | undefined)[]
    | undefined
) => {
  const tmpArray = [res].flat().flat();
  return filterNullable(tmpArray);
};
const outputFileToInputFile = (
  file: TransformPluginOutputFile
): TransformPluginInputFile => file;

const outputFileListToInputFileList = (list: TransformPluginOutputFile[]) =>
  list.map((e) => outputFileToInputFile(e));

export type TransformPluginTree = TransformPluginTreeNode[];

export interface TransformPluginTreeNode {
  plugin: TransformPlugin;
  children?: TransformPluginTreeNode[];
  config?: TransformPluginTreeNodeConfig;
}

export type TransformPluginWriteFileFunc = (
  files: TransformPluginOutputFile[],
  outputPath: string
) => MaybePromise<void>;

export const execTransformPluginNode = async (
  node: TransformPluginTreeNode,
  data: {
    inputFiles: TransformPluginInputFile[];
    writeFiles?: TransformPluginWriteFileFunc;
    finalUserConfig: FinalUserConfig;
  }
) => {
  const { plugin, children, config } = node;
  const { inputFiles, writeFiles, finalUserConfig } = data;
  let currentOutputFiles: TransformPluginOutputFile[] = [];
  let currentIgnoreFiles: TransformPluginOutputFile[] = [];

  await Promise.all(
    inputFiles.map(async (e) => {
      let matched = false;
      if (config?.match) {
        const match = config.match;
        matched = await match(e, { ...config }, plugin.match);
      } else {
        matched = await plugin.match(e, { ...config });
      }
      if (matched) {
        currentOutputFiles.push(e);
      } else {
        currentIgnoreFiles.push(e);
      }
    })
  );

  if (plugin.beforeTransform) {
    const currentInputFiles = outputFileListToInputFileList(currentOutputFiles);
    currentOutputFiles = toFileArray(
      await plugin.beforeTransform(currentInputFiles, finalUserConfig, config)
    );
  }
  if (plugin.transform) {
    const transform = plugin.transform;
    const currentInputFiles = outputFileListToInputFileList(currentOutputFiles);
    currentOutputFiles = toFileArray(
      (
        await Promise.all(
          currentInputFiles.map(async (inputFile) => {
            return await transform(inputFile, finalUserConfig, config);
          })
        )
      ).flat()
    );
  }
  if (plugin.afterTransform) {
    const currentInputFiles = outputFileListToInputFileList(currentOutputFiles);
    currentOutputFiles = toFileArray(
      await plugin.afterTransform(currentInputFiles, finalUserConfig, config)
    );
  }
  currentOutputFiles = [...currentOutputFiles, ...currentIgnoreFiles];
  if (config?.output) {
    await writeFiles?.([...currentOutputFiles], config.output);
  }
  if (children && children.length > 0) {
    const currentInputFiles = outputFileListToInputFileList(currentOutputFiles);
    await Promise.all(
      children.map(async (child) => {
        return await execTransformPluginNode(child, {
          inputFiles: currentInputFiles,
          writeFiles,
          finalUserConfig: finalUserConfig,
        });
      })
    );
  }
  return currentOutputFiles;
};

export const execTransformPluginTree = async (
  tree: TransformPluginTree,
  data: {
    inputFiles: TransformPluginInputFile[];
    writeFiles?: TransformPluginWriteFileFunc;
    finalUserConfig: FinalUserConfig;
  }
) => {
  await Promise.all(
    tree.map(async (treeNode) => {
      return await execTransformPluginNode(treeNode, data);
    })
  );
};
