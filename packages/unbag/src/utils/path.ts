import p from "path-browserify";
const {
  resolve: oldResolve,
  normalize,
  isAbsolute,
  join,
  relative: oldRelative,
  dirname,
  basename,
  extname,
  format,
  parse,
} = p;

const fixProcessUndefined = () => {
  try {
    if (!globalThis["process"]) {
      // @ts-ignore
      globalThis["process"] = {};
    }

    if (!globalThis["process"].cwd) {
      // @ts-ignore
      globalThis["process"].cwd = () => {
        return "/";
      };
    }
  } catch (error) {}
};

const resolve: typeof oldResolve = (...rest) => {
  fixProcessUndefined();
  return oldResolve(...rest);
};

const relative: typeof oldRelative = (...rest) => {
  return oldRelative(...rest);
};

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

const pathUtils = {
  resolve,
  normalize,
  isAbsolute,
  join,
  relative,
  dirname,
  basename,
  extname,
  format,
  parse,
  trimExtname,
  replaceExtname,
  rootName,
};

export default pathUtils;
export type IPathUtils = typeof pathUtils;
