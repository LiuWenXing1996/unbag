import { parse } from "yaml";
import path from "./path";
import { Volume, createFsFromVolume, type IFs } from "memfs";
import type * as _FsPromisesApi from "node:fs/promises";
export type FsPromisesApi = typeof _FsPromisesApi;
export type WriteFileData = Parameters<FsPromisesApi["writeFile"]>[1];
export type WriteFileOptions = Parameters<FsPromisesApi["writeFile"]>[2];
export type FsUtils = ReturnType<typeof createFsUtils> & FsPromisesApi;

export const createFsUtils = (fs: FsPromisesApi) => {
  const { readFile, readdir, stat, mkdir, writeFile, rm } = fs;
  const YAML = {
    parse,
  };

  const readJson = async <T>(path: string): Promise<T> => {
    let jsonObj: T | undefined = undefined;
    const content = (await readFile(path, "utf-8")) as string;
    jsonObj = JSON.parse(content || "") as T;
    return jsonObj;
  };

  const tryReadJson = async <T>(path: string): Promise<undefined | T> => {
    let jsonObj: T | undefined = undefined;
    try {
      jsonObj = await readJson<T>(path);
    } catch (error) {
      console.log("tryReadJson error:", path);
    }
    return jsonObj;
  };

  const readYaml = async <T>(path: string): Promise<T> => {
    let obj: T | undefined = undefined;
    const content = (await readFile(path, "utf-8")) as string;
    obj = YAML.parse(content || "") as T;
    return obj;
  };

  const tryReadYaml = async <T>(path: string): Promise<T | undefined> => {
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
      const fileList = (await readdir(currentDir)) as string[];
      for (const file of fileList) {
        const name = path.join(currentDir, file);
        if ((await stat(name)).isDirectory()) {
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
      await stat(path);
      return true;
    } catch {
      return false;
    }
  };

  const isFile = async (path: string) => {
    try {
      const _stat = await stat(path);
      return _stat.isFile();
    } catch {
      return false;
    }
  };

  const isDirectory = async (path: string) => {
    try {
      const _stat = await stat(path);
      return _stat.isDirectory();
    } catch {
      return false;
    }
  };

  const outputFile = async (
    file: string,
    data: WriteFileData,
    options?: WriteFileOptions
  ) => {
    const dir = path.dirname(file);
    const fileExist = await exists(dir);
    if (!fileExist) {
      // console.log(dir)
      await mkdir(dir, { recursive: true });
    }
    await writeFile(file, data, options);
  };

  const copyFromFs = async (
    inputDir: string,
    fromFs: FsPromisesApi,
    outputDir: string = ""
  ) => {
    const fromFsUtils = createFsUtils(fromFs);
    const toFsUtils = createFsUtils(fs);
    const files = await fromFsUtils.listFiles(inputDir);
    await Promise.all(
      files.map(async (filePath) => {
        const content = await fromFs.readFile(filePath);
        const outputFilePath = path.join(outputDir, filePath);
        await toFsUtils.outputFile(outputFilePath, content);
      })
    );
  };

  const remove = async (path: string) => {
    return await rm(path, { recursive: true, force: true });
  };

  return {
    ...fs,
    readJson,
    remove,
    tryReadJson,
    readYaml,
    tryReadYaml,
    listFiles,
    exists,
    isFile,
    isDirectory,
    outputFile,
    copyFromFs,
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
    },
  };

  return vfs;
};
