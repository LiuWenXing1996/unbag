import { TsToJsTransfer, defineConfig } from "./src";

export default defineConfig({
  entry: "./src",
  sourcemap: true,
  transfers: [
    {
      transfer: TsToJsTransfer({
        format: "esm",
      }),
      output: "./dist/esm",
    },
    {
      transfer: TsToJsTransfer({
        format: "cjs",
      }),
      output: "./dist/cjs",
    },
  ],
});
