import { TsToDtsPlugin, TsToJsPlugin, defineTransformConfig } from "./src";

export default defineTransformConfig({
  entry: "./src",
  sourcemap: true,
  plugins: [
    {
      config: {
        output: "./dist/types",
      },
      plugin: TsToDtsPlugin(),
    },
    {
      config: {
        output: "./dist/esm",
      },
      plugin: TsToJsPlugin({
        format: "esm",
      }),
    },
    {
      config: {
        output: "./dist/cjs",
      },
      plugin: TsToJsPlugin({
        format: "cjs",
      }),
    },
  ],
});
