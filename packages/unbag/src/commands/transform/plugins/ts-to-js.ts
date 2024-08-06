import { transform } from "esbuild";
import path from "../../../utils/path";
import { defineTransformPlugin, TransformPluginType } from "../plugin";
export const TsToJsTransformPlugin = (options?: {
  format?: "cjs" | "esm";
}) => {
  const {
    format
  } = options || {};
  return defineTransformPlugin({
    name: "ts-to-js",
    match: async file => {
      if ([".ts", ".cts", ".mts"].includes(file.filePath.extname)) {
        return true;
      }
      return false;
    },
    type: TransformPluginType.Single,
    transform: async params => {
      const {
        inputDir,
        currentFilePath
      } = params;
      const absoluteFilePath = currentFilePath.toAbsolutePath({
        rel: inputDir
      });
      const jsFile = await transform(file.content, {
        loader: "ts",
        format
        // platform: "node",
      });
      return {
        // path: path.replaceExtname(file.path, format === "esm" ? "mjs" : "cjs"),
        path: path.replaceExtname(file.path, "js"),
        content: jsFile.code,
        sourcemap: jsFile.map
      };
    }
  });
};