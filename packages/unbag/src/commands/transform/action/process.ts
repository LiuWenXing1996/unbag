import { FinalUserConfig } from "@/utils/config";
import { useLog } from "@/utils/log";
import { useMessage } from "@/utils/message";
import { AbsolutePath } from "@/utils/path";
import { v4 as uuidv4 } from "uuid";
import { useTransformTempDir } from "../utils";
import dayjs from "dayjs";
import { useFs } from "@/utils/fs";

export class TransformActionProcessUid {
  #content: string;
  constructor() {
    this.#content = uuidv4();
  }
  get content() {
    return this.#content;
  }
}

export const useTransformActionProcessMap = (params: {
  finalUserConfig: FinalUserConfig;
}) => {
  const { finalUserConfig } = params;
  const log = useLog({ finalUserConfig });
  const message = useMessage({ locale: finalUserConfig.locale });
  const transformTempDir = useTransformTempDir({ finalUserConfig });
  const processMap = new Map<
    TransformActionProcessUid,
    {
      tempDir: AbsolutePath;
    }
  >();
  const getProcessTempDir = (params: { uid: TransformActionProcessUid }) => {
    const { uid } = params;
    const processResult = processMap.get(uid);
    if (!processResult) {
      throw new Error(
        message.transform.action.processParentNotFound({ uid: uid.content })
      );
    }
    return processResult.tempDir;
  };
  const createProcess = async (params: {
    task: (params: { tempDir: AbsolutePath }) => Promise<void>;
    name: string;
    parentUid?: TransformActionProcessUid;
  }) => {
    const { name, task } = params;
    const fs = useFs();
    const uid = new TransformActionProcessUid();
    const fileName = name.replaceAll("/", "@");
    const tempDir = transformTempDir.resolve({
      next: `./${fileName}`,
    });
    processMap.set(uid, { tempDir });
    await fs.ensureDir(tempDir.content);
    const startTime = Date.now();
    log.info(
      message.transform.action.taskProcessing({
        name,
        startTime: dayjs(startTime).format("HH:mm:ss"),
      })
    );
    await task({ tempDir });
    const interval = Number(((Date.now() - startTime) / 1000).toFixed(2));
    log.info(message.transform.action.taskEnd({ name, interval }));
    return uid;
  };
  return {
    createProcess,
    getProcessTempDir,
  };
};
