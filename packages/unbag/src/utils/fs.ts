import { parse } from "yaml";
import path from "./path";
import { Volume, createFsFromVolume, type IFs } from "memfs";
import type * as _FsPromisesApi from "node:fs/promises";
import fs from "node:fs/promises";
import { MaybePromise } from "./types";
export type FsPromisesApi = typeof _FsPromisesApi;
export type WriteFileData = Parameters<FsPromisesApi["writeFile"]>[1];
export type WriteFileOptions = Parameters<FsPromisesApi["writeFile"]>[2];
export type FsUtils = ReturnType<typeof createFsUtils> & FsPromisesApi;
import fsExtra from "fs-extra/esm";
export const createFsUtils = (fs: FsPromisesApi) => {
  const {
    $readFile,
    $readdir,
    $stat,
    $mkdir,
    $writeFile,
    $rm
  } = new Proxy(({} as { [key in keyof FsPromisesApi as `$${key}`]: () => FsPromisesApi[key] }), {
    get(_target, property, _receiver) {
      return () => {
        if (typeof property !== "string") {
          throw new Error(`fs property type must string`);
        }
        const key = property.slice(1);
        const value = fs[key];
        if (!value) {
          throw new Error(`fs [${key}] undefined`);
        }
        return value;
      };
    }
  });
  const YAML = {
    parse
  };
  const readJson = async <T,>(path: string): Promise<T> => {
    let jsonObj: T | undefined = undefined;
    const content = (await $readFile()(path, "utf-8") as string);
    jsonObj = (JSON.parse(content || "") as T);
    return jsonObj;
  };
  const tryReadJson = async <T,>(path: string): Promise<undefined | T> => {
    let jsonObj: T | undefined = undefined;
    try {
      jsonObj = await readJson<T>(path);
    } catch (error) {
      console.log("tryReadJson error:", path);
    }
    return jsonObj;
  };
  const modifyJson = async <T, V = T>(path: string, modify: (input?: T) => MaybePromise<V | undefined>) => {
    let oldContent: string | undefined = undefined;
    let oldJson: T | undefined = undefined;
    try {
      oldContent = (await $readFile()(path, "utf-8") as string);
      oldJson = JSON.parse(oldContent || "");
    } catch (error) {}
    const newJson = (await modify(oldJson)) || "";
    const detectIndent = await import("detect-indent");
    const detectNewline = await import("detect-newline");
    const DEFAULT_INDENT = 2;
    const CRLF = "\r\n";
    const LF = "\n";
    const indent = detectIndent.default(oldContent || "").indent || DEFAULT_INDENT;
    const newline = detectNewline.detectNewline(oldContent || "");
    let newContent = JSON.stringify(newJson, null, indent);
    if (newline === CRLF) {
      newContent = newContent.replace(/\n/g, CRLF) + CRLF;
    }
    newContent = newContent + LF;
    await outputFile(path, newContent, "utf-8");
  };
  const readYaml = async <T,>(path: string): Promise<T> => {
    let obj: T | undefined = undefined;
    const content = (await $readFile()(path, "utf-8") as string);
    obj = (YAML.parse(content || "") as T);
    return obj;
  };
  const tryReadYaml = async <T,>(path: string): Promise<T | undefined> => {
    let jsonObj: T | undefined = undefined;
    try {
      jsonObj = await readYaml<T>(path);
    } catch (error) {
      console.log("tryReadYaml error:", path);
    }
    return jsonObj;
  };
  const listFiles = async (dir?: string) => {
    const files: string[] = [];
    dir = dir || "/";
    const getFiles = async (currentDir: string) => {
      const fileList = (await $readdir()(currentDir) as string[]);
      for (const file of fileList) {
        const name = path.join(currentDir, file);
        if ((await $stat()(name)).isDirectory()) {
          await getFiles(name);
        } else {
          files.push(name);
        }
      }
    };
    await getFiles(dir);
    return files;
  };
  const exists = async (path: string) => {
    try {
      await $stat()(path);
      return true;
    } catch (e) {
      return false;
    }
  };
  const isFile = async (path: string) => {
    try {
      const _stat = await $stat()(path);
      return _stat.isFile();
    } catch {
      return false;
    }
  };
  const isDirectory = async (path: string) => {
    try {
      const _stat = await $stat()(path);
      return _stat.isDirectory();
    } catch {
      return false;
    }
  };
  const outputFile = async (file: string, data: WriteFileData, options?: WriteFileOptions) => {
    const dir = path.dirname(file);
    const fileExist = await exists(dir);
    if (!fileExist) {
      await $mkdir()(dir, {
        recursive: true
      });
    }
    await $writeFile()(file, data, options);
  };
  const copyFromFs = async (inputDir: string, fromFs: FsPromisesApi, outputDir: string = "") => {
    const fromFsUtils = createFsUtils(fromFs);
    const toFsUtils = createFsUtils(fs);
    const files = await fromFsUtils.listFiles(inputDir);
    await Promise.all(files.map(async filePath => {
      const content = await fromFs.readFile(filePath);
      const outputFilePath = path.join(outputDir, filePath);
      await toFsUtils.outputFile(outputFilePath, content);
    }));
  };
  const remove = async (path: string) => {
    return await $rm()(path, {
      recursive: true,
      force: true
    });
  };
  return {
    ...fs,
    readJson,
    modifyJson,
    remove,
    tryReadJson,
    readYaml,
    tryReadYaml,
    listFiles,
    exists,
    isFile,
    isDirectory,
    outputFile,
    copyFromFs
  };
};
export interface VirtualFileSystem extends FsUtils {
  getFs: () => IFs;
}
export const createVfs = (): VirtualFileSystem => {
  const vol = new Volume();
  const fs = createFsFromVolume(vol);

  // @ts-ignore
  const fsUtils = createFsUtils(fs.promises);
  const vfs: VirtualFileSystem = {
    ...(fsUtils as FsUtils),
    getFs: () => {
      return fs;
    }
  };
  return vfs;
};
export const useFs = () => {
  const fsUtils = createFsUtils(fs);
  const {
    emptyDir,
    ensureDir,
    copy
  } = fsExtra;
  return {
    ...fsUtils,
    emptyDir,
    ensureDir,
    copy
    // ...fsExtra,
  };
};