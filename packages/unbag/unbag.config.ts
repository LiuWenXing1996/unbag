import { TsToDtsPlugin, TsToJsPlugin, defineConfig } from "./src";

export default defineConfig({
  transform: {
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
  },
});
