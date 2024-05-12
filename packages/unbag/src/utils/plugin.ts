import { MaybePromise } from "./types";
import { TransformConfig } from "../commands/transform";
import { filterNullable } from "./common";

export interface PluginInputFile {
  path: string;
  content: string | Buffer;
  sourcemap?: string;
}
export interface PluginOutputFile {
  path: string;
  content: string | Buffer;
  sourcemap?: string;
}

export type Plugin = {
  name: string;
  match: (
    file: PluginInputFile,
    pluginConfig?: PluginTreeNodeConfig
  ) => MaybePromise<boolean>;
  beforeTransform?: (
    input: PluginInputFile[],
    transformConfig: TransformConfig,
    pluginConfig?: PluginTreeNodeConfig
  ) => MaybePromise<PluginOutputFile | PluginOutputFile[] | undefined>;
  transform?: (
    input: PluginInputFile,
    transformConfig: TransformConfig,
    pluginConfig?: PluginTreeNodeConfig
  ) => MaybePromise<PluginOutputFile | PluginOutputFile[] | undefined>;
  afterTransform?: (
    input: PluginInputFile[],
    transformConfig: TransformConfig,
    pluginConfig?: PluginTreeNodeConfig
  ) => MaybePromise<PluginOutputFile | PluginOutputFile[] | undefined>;
};

export interface PluginTreeNodeConfig {
  output?: string;
  match?: (
    file: PluginInputFile,
    pluginConfig?: PluginTreeNodeConfig,
    pluginMatch?: Plugin["match"]
  ) => MaybePromise<boolean>;
}

const toFileArray = (
  res: PluginOutputFile | (PluginOutputFile | undefined)[] | undefined
) => {
  const tmpArray = [res].flat().flat();
  return filterNullable(tmpArray);
};
const outputFileToInputFile = (file: PluginOutputFile): PluginInputFile =>
  file;

const outputFileListToInputFileList = (list: PluginOutputFile[]) =>
  list.map((e) => outputFileToInputFile(e));

export type PluginTree = PluginTreeNode[];

export interface PluginTreeNode {
  plugin: Plugin;
  children?: PluginTreeNode[];
  config?: PluginTreeNodeConfig;
}

export type PluginWriteFileFunc = (
  files: PluginOutputFile[],
  outputPath: string
) => MaybePromise<void>;

export const execPluginNode = async (
  node: PluginTreeNode,
  data: {
    inputFiles: PluginInputFile[];
    writeFiles?: PluginWriteFileFunc;
    transformConfig: TransformConfig;
  }
) => {
  const { plugin, children, config } = node;
  const { inputFiles, writeFiles, transformConfig } = data;
  let currentOutputFiles: PluginOutputFile[] = [];
  let currentIgnoreFiles: PluginOutputFile[] = [];

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
      await plugin.beforeTransform(currentInputFiles, transformConfig)
    );
  }
  if (plugin.transform) {
    const transform = plugin.transform;
    const currentInputFiles = outputFileListToInputFileList(currentOutputFiles);
    currentOutputFiles = toFileArray(
      (
        await Promise.all(
          currentInputFiles.map(async (inputFile) => {
            return await transform(inputFile, transformConfig);
          })
        )
      ).flat()
    );
  }
  if (plugin.afterTransform) {
    const currentInputFiles = outputFileListToInputFileList(currentOutputFiles);
    currentOutputFiles = toFileArray(
      await plugin.afterTransform(currentInputFiles, transformConfig)
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
        return await execPluginNode(child, {
          inputFiles: currentInputFiles,
          writeFiles,
          transformConfig,
        });
      })
    );
  }
  return currentOutputFiles;
};

export const execPluginTree = async (
  tree: PluginTree,
  data: {
    inputFiles: PluginInputFile[];
    writeFiles?: PluginWriteFileFunc;
    transformConfig: TransformConfig;
  }
) => {
  await Promise.all(
    tree.map(async (treeNode) => {
      return await execPluginNode(treeNode, data);
    })
  );
};
