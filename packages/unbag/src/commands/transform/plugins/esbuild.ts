import { transform, TransformOptions } from "esbuild";
import {
  defineTransformPlugin,
  TransformPluginOutputFileType,
} from "../plugin";
import { useFs } from "./../../../utils/fs";
export type TransformPluginEsbuildOptions = {
  esbuild: Omit<TransformOptions, "sourcemap" | "sourcefile">;
  extMapping: Record<string, string>;
};
export const TransformPluginEsbuild = (
  options: TransformPluginEsbuildOptions
) => {
  const { esbuild: esbuildOptions, extMapping } = options;
  return defineTransformPlugin({
    name: "esbuild",
    transform: async (params) => {
      const { inputDir, filePaths } = params;
      const matchedExtnames = Object.keys(extMapping);
      const filePathsFiltered = filePaths.filter((filePath) => {
        if (matchedExtnames.includes(filePath.extname)) {
          return true;
        }
        return false;
      });
      const outputFiles = await Promise.all(
        filePathsFiltered.map(async (filePath) => {
          const absoluteFilePath = filePath.toAbsolutePath({
            rel: inputDir,
          });
          const fs = useFs();
          const content = await fs.readFile(absoluteFilePath.content, "utf-8");
          const jsFile = await transform(content, {
            ...esbuildOptions,
          });
          const targetExtName = extMapping[filePath.extname];
          return {
            from: filePath,
            to: filePath.replaceExtname(targetExtName),
            type: TransformPluginOutputFileType.Transformed,
            content: jsFile.code,
            sourcemap: jsFile.map,
          };
        })
      );
      return outputFiles;
    },
  });
};
