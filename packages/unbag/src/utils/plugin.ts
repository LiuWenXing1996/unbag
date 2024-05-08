import { MaybePromise } from "./types";
import { ITransformConfig } from "../commands/transform";
import { filterNullable } from "./common";

export interface IPluginInputFile {
  path: string;
  content: string | Buffer;
  sourcemap?: string;
}
export interface IPluginOutputFile {
  path: string;
  content: string | Buffer;
  sourcemap?: string;
}

export type IPlugin = {
  name: string;
  match: (
    file: IPluginInputFile,
    pluginConfig?: IPluginTreeNodeConfig
  ) => MaybePromise<boolean>;
  beforeTransform?: (
    input: IPluginInputFile[],
    transformConfig: ITransformConfig,
    pluginConfig?: IPluginTreeNodeConfig
  ) => MaybePromise<IPluginOutputFile | IPluginOutputFile[] | undefined>;
  transform?: (
    input: IPluginInputFile,
    transformConfig: ITransformConfig,
    pluginConfig?: IPluginTreeNodeConfig
  ) => MaybePromise<IPluginOutputFile | IPluginOutputFile[] | undefined>;
  afterTransform?: (
    input: IPluginInputFile[],
    transformConfig: ITransformConfig,
    pluginConfig?: IPluginTreeNodeConfig
  ) => MaybePromise<IPluginOutputFile | IPluginOutputFile[] | undefined>;
};

export interface IPluginTreeNodeConfig {
  output?: string;
  match?: (
    file: IPluginInputFile,
    pluginConfig?: IPluginTreeNodeConfig,
    pluginMatch?: IPlugin["match"]
  ) => MaybePromise<boolean>;
}

const toFileArray = (
  res: IPluginOutputFile | (IPluginOutputFile | undefined)[] | undefined
) => {
  const tmpArray = [res].flat().flat();
  return filterNullable(tmpArray);
};
const outputFileToInputFile = (file: IPluginOutputFile): IPluginInputFile =>
  file;

const outputFileListToInputFileList = (list: IPluginOutputFile[]) =>
  list.map((e) => outputFileToInputFile(e));

export type IPluginTree = IPluginTreeNode[];

export interface IPluginTreeNode {
  plugin: IPlugin;
  children?: IPluginTreeNode[];
  config?: IPluginTreeNodeConfig;
}

export type IPluginWriteFileFunc = (
  files: IPluginOutputFile[],
  outputPath: string
) => MaybePromise<void>;

export const execPluginNode = async (
  node: IPluginTreeNode,
  data: {
    inputFiles: IPluginInputFile[];
    writeFiles?: IPluginWriteFileFunc;
    transformConfig: ITransformConfig;
  }
) => {
  const { plugin, children, config } = node;
  const { inputFiles, writeFiles, transformConfig } = data;
  let currentOutputFiles: IPluginOutputFile[] = [];
  let currentIgnoreFiles: IPluginOutputFile[] = [];

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
  tree: IPluginTree,
  data: {
    inputFiles: IPluginInputFile[];
    writeFiles?: IPluginWriteFileFunc;
    transformConfig: ITransformConfig;
  }
) => {
  await Promise.all(
    tree.map(async (treeNode) => {
      return await execPluginNode(treeNode, data);
    })
  );
};
