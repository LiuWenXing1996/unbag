import { transform } from "esbuild";
import path from "../../../utils/path";
import { defineTransformPlugin } from "../plugin";

export const TsToJsTransformPlugin = (options?: { format?: "cjs" | "esm" }) => {
  const { format } = options || {};
  return defineTransformPlugin({
    name: "ts-to-js",
    match: (file) => {
      if (path.extname(file.path) === ".ts") {
        return true;
      }
      return false;
    },
    transform: async (file) => {
      const jsFile = await transform(file.content, {
        loader: "ts",
        format,
        platform: "node",
      });
      return {
        // path: path.replaceExtname(file.path, format === "esm" ? "mjs" : "js"),
        path: path.replaceExtname(file.path, "js"),
        content: jsFile.code,
        sourcemap: jsFile.map,
      };
    },
  });
};
