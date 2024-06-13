import {
  TsToDtsTransformPlugin,
  TsToJsTransformPlugin,
  defineUserConfig,
} from "./src";

export default defineUserConfig({
  transform: {
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
  release: {
    tagPrefix: "unbag@",
    scope: "unbag",
    disableWriteVersion: true,
    changelogHeader: `fhsjdkfh`,
    changelogFooter: `fddddhsjdkfh`,
  },
});
