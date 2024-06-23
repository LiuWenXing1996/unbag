import { FinalUserConfig } from "./config";
import * as nodePath from "node:path";
export type NodePathApi = typeof nodePath;

export const createPathUtils = (path: NodePathApi) => {
  const { extname, resolve } = path;
  const trimExtname = (path: string, extnames?: string[]) => {
    let willTrim = true;
    const _extname = extname(path);
    if (extnames) {
      willTrim = extnames.includes(_extname);
    }
    if (willTrim && _extname) {
      return path.slice(0, path.length - _extname.length);
    } else {
      return path;
    }
  };

  const replaceExtname = (path: string, extname: string) => {
    let newPath = trimExtname(path);
    return `${newPath}.${extname}`;
  };

  const rootName = () => {
    return resolve();
  };
  return {
    trimExtname,
    replaceExtname,
    rootName,
    ...path,
  };
};
const pathUtils = createPathUtils(nodePath);

export const usePath = () => {
  const pathUtils = createPathUtils(nodePath);
  return pathUtils;
};

export default pathUtils;
export type IPathUtils = typeof pathUtils;
