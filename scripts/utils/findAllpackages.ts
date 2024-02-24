import path from "path";
import { readdir } from "fs/promises";
import { resolvePkgJson } from "./resolvePkgJson";
import isDir from "./isDir";

export interface IPkg {
  name: string;
  path: string;
}

export const findAllPkgs = async () => {
  const workspaceDirs = ["./packages", "./examples"];
  const absolutePaths = workspaceDirs.map((e) => path.resolve(e));
  const pkgDirs: string[] = [];
  await Promise.all(
    absolutePaths.map(async (e) => {
      const dirList = (await readdir(e))
        .map((t) => path.resolve(e, t))
        .filter((e) => {
          return isDir(e);
        });
      pkgDirs.push(...dirList);
    })
  );
  const pkgs: IPkg[] = [];

  await Promise.all(
    pkgDirs.map(async (e) => {
      const pkgJsonPath = path.join(e, "./package.json");
      const { name } = (await resolvePkgJson(pkgJsonPath)) || {};
      if (name) {
        pkgs.push({
          name,
          path: e,
        });
      }
    })
  );

  const prePkgNames = [
    "@vue-cook/core",
    "@vue-cook/schema-bundler",
    "@vue-cook/ui",
    "@vue-cook/cli",
    "vite-single-page-app",
    "server-demo",
    "studio-demo",
  ];
  const prePkgs = prePkgNames
    .map((e) => pkgs.find((t) => t.name === e))
    .filter((e) => e) as IPkg[];
  const postPkgs = pkgs.filter((t) => !prePkgNames.includes(t.name));
  const pkgsSorted: IPkg[] = [...prePkgs, ...postPkgs];
  console.log(pkgsSorted.map((e) => e.name));
  return pkgsSorted;
};
