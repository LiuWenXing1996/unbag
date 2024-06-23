import { filterNullable, wrapperZodLazyResult } from "../../utils/common";
import { FinalUserConfig } from "../../utils/config";
import z from "zod";
import { defineConfigSchema } from "../../utils/schema";

// TODO:全部使用 zod 也太复杂了，不好调试
// 感觉改一改 merge config 的数组合并行为
// 然后在运行的时候手动做校验更合理些
// TODO:是否有可能利用zod 做一个纯运行时安全的东西？感觉做这个意义是有的，但是，需要用起来不能太痛苦，试了下，现在的 zod
// 一旦嵌套和循环多了起来可太痛苦了，所以直接讲 ts==>zod 自动化更合理一点

export const TransformPluginInputFileSchema = defineConfigSchema(() =>
  z.object({
    path: z.string(),
    content: z.union([z.string(), z.instanceof(Buffer)]),
    sourcemap: z.string().optional(),
  })
);

export type TransformPluginInputFile = z.infer<
  typeof TransformPluginInputFileSchema
>;

export const TransformPluginOutputFileSchema = z.object({
  path: z.string(),
  content: z.union([z.string(), z.instanceof(Buffer)]),
  sourcemap: z.string().optional(),
});

export type TransformPluginOutputFile = z.infer<
  typeof TransformPluginOutputFileSchema
>;

export type TransformPlugin = {
  name: string;
  match: (
    file: TransformPluginInputFile,
    pluginConfig: TransformPluginTreeNodeConfig
  ) => Promise<boolean>;
  beforeTransform?: (
    input: TransformPluginInputFile[],
    finalUserConfig: FinalUserConfig,
    pluginConfig?: TransformPluginTreeNodeConfig
  ) => Promise<
    TransformPluginOutputFile | TransformPluginOutputFile[] | undefined
  >;
  transform?: (
    input: TransformPluginInputFile,
    finalUserConfig: FinalUserConfig,
    pluginConfig?: TransformPluginTreeNodeConfig
  ) => Promise<
    TransformPluginOutputFile | TransformPluginOutputFile[] | undefined
  >;
  afterTransform?: (
    input: TransformPluginInputFile[],
    finalUserConfig: FinalUserConfig,
    pluginConfig?: TransformPluginTreeNodeConfig
  ) => Promise<
    TransformPluginOutputFile | TransformPluginOutputFile[] | undefined
  >;
};

export const TransformPluginMatchSchema = defineConfigSchema(() =>
  z
    .function()
    .args(TransformPluginInputFileSchema, TransformPluginTreeNodeConfigSchema)
    .returns(z.promise(z.boolean()))
);

export const TransformPluginSchema: z.ZodSchema<TransformPlugin> = z.lazy(() =>
  wrapperZodLazyResult(
    z.object({
      name: z.string(),
      match: TransformPluginMatchSchema,
      beforeTransform: z
        .function()
        .args()
        .returns(
          z.promise(
            z.union([
              TransformPluginOutputFileSchema,
              z.array(TransformPluginOutputFileSchema),
              z.undefined(),
            ])
          )
        )
        .optional(),
    })
  )
);

export const defineTransformPlugin = (p: TransformPlugin) => p;

export const TransformPluginTreeNodeConfigSchema: z.ZodSchema<TransformPluginTreeNodeConfig> =
  z.lazy(() =>
    wrapperZodLazyResult(
      z.object({
        output: z.string().optional(),
        match: z
          .function()
          .args(
            TransformPluginInputFileSchema,
            TransformPluginTreeNodeConfigSchema,
            TransformPluginMatchSchema
          )
          .returns(z.promise(z.boolean()))
          .optional(),
      })
    )
  );

export interface TransformPluginTreeNodeConfig {
  output?: string;
  match?: (
    file: TransformPluginInputFile,
    pluginConfig?: TransformPluginTreeNodeConfig,
    pluginMatch?: TransformPlugin["match"]
  ) => Promise<boolean>;
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

export const TransformPluginTreeNodeSchema =
  defineConfigSchema<TransformPluginTreeNode>(() =>
    z.object({
      plugin: TransformPluginSchema,
      children: z.array(TransformPluginTreeNodeSchema).optional(),
      config: TransformPluginTreeNodeConfigSchema.optional(),
    })
  );

export const TransformPluginTreeSchema =
  defineConfigSchema<TransformPluginTree>(() =>
    z.array(TransformPluginTreeNodeSchema)
  );
export type TransformPluginTree = TransformPluginTreeNode[];

export interface TransformPluginTreeNode {
  plugin: TransformPlugin;
  children?: TransformPluginTreeNode[];
  config?: TransformPluginTreeNodeConfig;
}

export type TransformPluginWriteFileFunc = (
  files: TransformPluginOutputFile[],
  outputPath: string
) => Promise<void>;

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
