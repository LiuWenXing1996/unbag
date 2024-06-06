import {
  TsToDtsTransformPlugin,
  TsToJsTransformPlugin,
  defineConfig,
} from "unbag";

export default defineConfig({
  transform: {
    entry: "./src",
    sourcemap: true,
    plugins: [
      {
        config: {
          output: "./dist/types",
        },
        plugin: TsToDtsTransformPlugin(),
      },
      {
        config: {
          output: "./dist/esm",
        },
        plugin: TsToJsTransformPlugin({
          format: "esm",
        }),
      },
      {
        config: {
          output: "./dist/cjs",
        },
        plugin: TsToJsTransformPlugin({
          format: "cjs",
        }),
      },
    ],
  },
});
