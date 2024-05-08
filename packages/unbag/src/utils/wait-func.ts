import * as fsPromises from "node:fs/promises";
import pathUtils from "../utils/path";
import { createFsUtils } from "./fs";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const defaultTempDir = "./node_modules/.unbag";
const fs = createFsUtils(fsPromises);
export const SUCCESS = "SUCCESS";
export const FAIL = "FAIL";
export const getResFilePath = (params: { tempDir: string; tag: string }) => {
  const { tempDir, tag } = params;
  let absouteTempPath = tempDir;
  if (!pathUtils.isAbsolute(absouteTempPath)) {
    absouteTempPath = pathUtils.join(process.cwd(), absouteTempPath);
  }
  return pathUtils.join(absouteTempPath, tag + ".txt");
};
export const writeWaitFuncResToFile = async (params: {
  tempDir?: string;
  tag: string;
  isSuccess: boolean;
}) => {
  const { tempDir = defaultTempDir, tag, isSuccess } = params;
  const filePath = getResFilePath({ tempDir, tag });
  await fs.outputFile(filePath, isSuccess ? SUCCESS : FAIL);
};
export const checkWaitFuncResByFile = async (params: {
  name: string;
  tempDir?: string;
  tag: string;
  timeout?: number;
  interval?: number;
}) => {
  const {
    name,
    tempDir = defaultTempDir,
    tag,
    timeout = 10000,
    interval = 500,
  } = params;
  const filePath = getResFilePath({ tempDir, tag });
  const startTime = Date.now();
  let content = "";
  const tryGetRes = async () => {
    console.log(`${name} wait ...`);
    let timeSpan = Date.now() - startTime;
    if (timeSpan > timeout) {
      return;
    }
    try {
      content = await fs.readFile(filePath, "utf-8");
    } catch (error) {}
    if (!content) {
      await sleep(interval);
      await tryGetRes();
    }
  };
  await tryGetRes();
  return content === SUCCESS;
};
export const genWaitCommand = (params: {
  name: string;
  tag: string;
  tempDir?: string;
  interval?: number;
  timeout?: number;
}) => {
  const { interval, timeout, tempDir, tag, name } = params || {};
  let cmd = `unbag wait -n ${name} -tg ${tag}`;
  if (interval) {
    cmd = `${cmd} -i ${interval}`;
  }
  if (timeout) {
    cmd = `${cmd} -tm ${timeout}`;
  }
  if (tempDir) {
    cmd = `${cmd} -td ${tempDir}`;
  }
  return cmd;
};
