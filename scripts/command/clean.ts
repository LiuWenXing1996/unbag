import { resolve } from "node:path";
import { findAllPkgs } from "../utils/findAllpackages";
import trash from "trash";

export const clean = async () => {
  const allPkgs = await findAllPkgs();
  const pathsWillRemove: string[] = [];
  for (let i = 0; i < allPkgs.length; i++) {
    const pkg = allPkgs[i];
    const distResolvePath = resolve(pkg.path, "./dist");
    pathsWillRemove.push(distResolvePath);
  }
  for (let i = 0; i < pathsWillRemove.length; i++) {
    const pathWillRemove = pathsWillRemove[i];
    await trash(pathWillRemove);
    console.log(`move to trash: ${pathWillRemove}`);
  }
};
