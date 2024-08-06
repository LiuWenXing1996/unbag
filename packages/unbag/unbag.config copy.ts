import {
  TsToDtsTransformPlugin,
  TsToJsTransformPlugin,
  TransformPluginAlias,
  TransformPluginBabel,
  defineUserConfig,
  TransformPluginEsbuild,
} from "./src";

export default defineUserConfig({
  transform: {
    sourcemap: true,
    action: async ({ helper, finalUserConfig }) => {
      const { esbuild, alias, babel, out } = helper;
      const aliasUid = await alias({
        name: "alias",
        options: {
          paths: {
            "@": "src",
          },
        },
      });
      const esmEsbuild = await esbuild({
        name: "esm-esbuild",
        options: {
          esbuild: {
            format: "esm",
            loader: "ts",
          },
          extMapping: {
            ".mts": ".mjs",
            ".ts": ".js",
            ".cts": ".cjs",
          },
        },
        parentUid: aliasUid,
      });
      const esmEsbuild = await esbuild({
        name: "esm-esbuild",
        options: {
          esbuild: {
            format: "esm",
            loader: "ts",
          },
          extMapping: {
            ".mts": ".mjs",
            ".ts": ".js",
            ".cts": ".cjs",
          },
        },
        parentUid: aliasUid,
      });
    },
    // TODO:直接使用一个 task 函数，让用户自定义？
    /**
     * task process
     * task: 输入为多个 input dir ,输出为单个 out dir
     */
    plugins: [
      {
        plugin: TransformPluginAlias({
          paths: {
            "@": "src",
          },
        }),
        children: [
          {
            plugin: TransformPluginEsbuild({
              esbuild: {
                format: "esm",
                loader: "ts",
              },
              extMapping: {
                ".mts": ".mjs",
                ".ts": ".js",
                ".cts": ".cjs",
              },
            }),
            children: [
              {
                config: {
                  output: "./dist/esm",
                },
                plugin: TransformPluginBabel({
                  babel: {
                    plugins: [
                      [
                        "babel-plugin-add-import-extension",
                        { extension: "mjs" },
                      ],
                    ],
                  },
                  extMapping: {
                    ".mjs": ".mjs",
                    ".js": ".mjs",
                    ".cjs": ".mjs",
                  },
                }),
              },
            ],
          },
          {
            plugin: TransformPluginEsbuild({
              esbuild: {
                format: "esm",
                loader: "ts",
              },
              extMapping: {
                ".mts": ".mjs",
                ".ts": ".js",
                ".cts": ".cjs",
              },
            }),
            children: [
              {
                config: {
                  output: "./dist/cjs",
                },
                plugin: TransformPluginBabel({
                  babel: {
                    plugins: [
                      [
                        "babel-plugin-add-import-extension",
                        { extension: "cjs" },
                      ],
                    ],
                  },
                  extMapping: {
                    ".mjs": ".cjs",
                    ".js": ".cjs",
                    ".cjs": ".cjs",
                  },
                }),
              },
            ],
          },
        ],
      },
      // {
      //   config: {
      //     output: "./dist/types",
      //   },
      //   plugin: TsToDtsTransformPlugin(),
      // },
      // {
      //   config: {
      //     output: "./dist/esm",
      //   },
      //   plugin: TsToJsTransformPlugin({
      //     format: "esm",
      //   }),
      //   children: [
      //     {
      //       config: {
      //         output: "./dist/babel",
      //       },
      //       plugin: TransformPluginBabel({
      //         plugins: [
      //           ["babel-plugin-add-import-extension", { extension: "js" }],
      //           // ["replace-import-extension", { extMapping: { ".js": ".cjs" } }],
      //         ],
      //       }),
      //     },
      //   ],
      // },
      // {
      //   config: {
      //     output: "./dist/cjs",
      //   },
      //   plugin: TsToJsTransformPlugin({
      //     format: "cjs",
      //   }),
      // },
    ],
  },
  release: {
    scope: "unbag",
    branch: {
      mainCheckDisable: true,
    },
    tag: {
      prefix: "unbag@",
      disable: true,
    },
  },
});
