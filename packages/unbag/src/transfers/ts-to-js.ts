import { ITransfer } from "../utils/transfer";
import { transform } from "esbuild";

export const TsToJsTransfer = (options?: {
  format?: "iife" | "cjs" | "esm";
}): ITransfer => {
  const { format } = options || {};
  return {
    name: "ts-to-js",
    transform: async (file, helper) => {
      const { path } = helper;
      if (!(path.extname(file.path) === ".ts")) {
        return file;
      }
      const jsFile = await transform(file.content, {
        loader: "ts",
        format,
      });
      jsFile.map;
      return {
        path: path.replaceExtname(file.path, "js"),
        content: jsFile.code,
        sourcemap: jsFile.map,
      };
    },
  };
};
