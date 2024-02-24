import { parse } from "yaml";
import path from "./path";
import { Volume, createFsFromVolume, type IFs } from "memfs";
import type * as _FsPromisesApi from "node:fs/promises";
export type IFsPromisesApi = typeof _FsPromisesApi;
export type IWriteFileData = Parameters<IFsPromisesApi["writeFile"]>[1];
export type IWriteFileOptions = Parameters<IFsPromisesApi["writeFile"]>[2];
export type IFsUtils = ReturnType<typeof createFsUtils> & IFsPromisesApi;

export const createFsUtils = (fs: IFsPromisesApi) => {
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
    data: IWriteFileData,
    options?: IWriteFileOptions
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
    inputdDir: string,
    fromFs: IFsPromisesApi,
    outputDir: string = ""
  ) => {
    const fromFsUtils = createFsUtils(fromFs);
    const toFsUtils = createFsUtils(fs);
    const files = await fromFsUtils.listFiles(inputdDir);
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

export interface IVirtulFileSystem extends IFsUtils {
  getFs: () => IFs;
}

export const createVfs = (): IVirtulFileSystem => {
  const vol = new Volume();
  const fs = createFsFromVolume(vol);

  // @ts-ignore
  const fsUtils = createFsUtils(fs.promises);

  const vfs: IVirtulFileSystem = {
    ...(fsUtils as IFsUtils),
    getFs: () => {
      return fs;
    },
  };

  return vfs;
};
