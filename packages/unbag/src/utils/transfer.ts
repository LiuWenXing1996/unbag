import { MaybePromise } from "./types";
import { type IPathUtils } from "./path";
import { type IFsUtils } from "./fs";

export interface ITransferInputFile {
  path: string;
  content: string;
  sourcemap?: string;
}
export interface ITransferOutputFile {
  path: string;
  content: string;
  sourcemap?: string;
}

export interface ITransferHelper {
  path: IPathUtils;
  fs: IFsUtils;
}

export type ITransfer = {
  name: string;
  transform?: (
    input: ITransferInputFile,
    helper: ITransferHelper
  ) => MaybePromise<ITransferOutputFile | ITransferOutputFile[]>;
  transformAll?: (
    input: ITransferInputFile[]
  ) => MaybePromise<ITransferOutputFile[]>;
};

export type ITransferTree = ITransferTreeNode[];

export interface ITransferTreeNode {
  transfer: ITransfer;
  output?: string;
  isLeaf?: boolean;
  children?: ITransferTreeNode[];
}

export type ITransferWriteFileFunc = (
  files: ITransferOutputFile[],
  outputPath: string
) => MaybePromise<void>;

export const execTransferNode = async (
  node: ITransferTreeNode,
  data: {
    inputFiles: ITransferInputFile[];
    writeFiles?: ITransferWriteFileFunc;
    helper: ITransferHelper;
  }
) => {
  const { transfer, output, isLeaf, children } = node;
  const { inputFiles, writeFiles, helper } = data;
  let outputFiles: ITransferOutputFile[] = [];
  if (transfer.transform) {
    const transform = transfer.transform;
    outputFiles = (
      await Promise.all(
        inputFiles.map(async (inputFile) => {
          return await transform(inputFile, helper);
        })
      )
    ).flat();
  }
  if (transfer.transformAll) {
    const transformAll = transfer.transformAll;
    const inputFiles: ITransferOutputFile[] = [...outputFiles];
    outputFiles = await transformAll(inputFiles);
  }
  if (output) {
    await writeFiles?.(outputFiles, output);
  }
  if (!isLeaf) {
    if (children && children.length > 0) {
      const inputFiles: ITransferOutputFile[] = [...outputFiles];
      await Promise.all(
        children.map(async (child) => {
          return await execTransferNode(child, {
            inputFiles,
            writeFiles,
            helper,
          });
        })
      );
    }
  }
  return outputFiles;
};

export const execTransferTree = async (
  tree: ITransferTree,
  data: {
    inputFiles: ITransferInputFile[];
    writeFiles?: ITransferWriteFileFunc;
    helper: ITransferHelper;
  }
) => {
  await Promise.all(
    tree.map(async (treeNode) => {
      return await execTransferNode(treeNode, data);
    })
  );
};
