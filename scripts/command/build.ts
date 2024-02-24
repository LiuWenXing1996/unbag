import { join } from "path";
import { build as tsupBuild, type Options as ITsupBuildOptions } from "tsup";
import { transformAsync } from "@babel/core";
import Vue from "unplugin-vue/esbuild";

const genTsupBuildOptions = (params: {
  format: "esm" | "cjs";
  entryDir: string;
  outDir: string;
  sourcemap?: boolean;
}): ITsupBuildOptions => {
  const { format, entryDir, outDir, sourcemap } = params;
  return {
    entry: [entryDir],
    bundle: false,
    format: "esm",
    clean: true,
    sourcemap,
    outDir,
    dts: {
      compilerOptions: {
        "target": "esnext",
        "module": "esnext",
        "moduleResolution": "bundler",
        "allowJs": true,
        "noEmit": true
      },
    },
    outExtension: () => {
      return {
        js: `.js`,
        dts: `.ts`,
      };
    },
    plugins: [
      {
        name: "replace-import-extension",
        renderChunk: async (code, chunkInfo) => {
          const res = await transformAsync(code, {
            plugins: [
              [
                "replace-import-extension",
                {
                  extMapping: { ".vue": "", ".less": ".css" },
                },
              ],
            ],
          });
          // console.log("code", code);
          return {
            code: res?.code || "",
            map: res?.map || "",
          };
        },
      },
      {
        name: "transform-require-extensions",
        renderChunk: async (code, chunkInfo) => {
          const res = await transformAsync(code, {
            plugins: [
              [
                "transform-require-extensions",
                {
                  extensions: { ".vue": "", ".less": ".css" },
                },
              ],
            ],
          });
          // console.log("code", code);
          return {
            code: res?.code || "",
            map: res?.map || "",
          };
        },
      },
    ],
    esbuildPlugins: [
      Vue({
        isProduction: true,
      }),
    ],
  };
};

export const build = async () => {
  const root = process.cwd();
  // await tsupBuild(
  //   genTsupBuildOptions({
  //     format: "cjs",
  //     entryDir: join(root, "./src"),
  //     outDir: join(root, "./dist/cjs"),
  //     sourcemap: true,
  //   })
  // );
  await tsupBuild(
    genTsupBuildOptions({
      format: "esm",
      entryDir: join(root, "./src"),
      outDir: join(root, "./dist/esm"),
      sourcemap: true,
    })
  );
};
