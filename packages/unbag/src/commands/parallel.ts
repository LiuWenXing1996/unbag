import { MaybePromise } from "../utils/types";
import { v4 as uuidv4 } from "uuid";
import { genWaitCommand } from "../utils/wait-func";
import { writeWaitFuncResToFile } from "../utils/wait-func";
import concurrently from "concurrently";

export interface ParallelConfig {
  tempDir?: string;
  commands: ParallelCommand[];
}

export interface ParallelCommand {
  name: string;
  wait?: () => MaybePromise<boolean>;
  waitTimeout?: number;
  waitInterval?: number;
  npmScript: string;
}

export interface Command {
  command: string;
  name: string;
}

export const parallel = async (config: ParallelConfig) => {
  const waitFuncMap = new Map<string, ParallelCommand["wait"]>();
  const commands: Command[] = config.commands.map((e) => {
    let command = `${e.npmScript}`;
    if (e.wait) {
      const waitTag = `${e.name}_wait_${uuidv4()}`;
      const waitCmd = genWaitCommand({
        tag: waitTag,
        name: e.name,
        tempDir: config.tempDir,
        interval: e.waitInterval,
        timeout: e.waitTimeout,
      });
      command = `${waitCmd} && ${command}`;
      waitFuncMap.set(waitTag, e.wait);
    }
    return {
      name: e.name,
      command,
    };
  });
  concurrently(commands, {
    prefixColors: "auto",
    prefix: "[{time}]-[{name}]",
    timestampFormat: "HH:mm:ss",
    killOthers: ["failure"],
  });
  const waitFuncObj = Object.fromEntries(waitFuncMap.entries());
  Object.keys(waitFuncObj).map(async (tag) => {
    const func = waitFuncObj[tag];
    let res = true;
    if (func) {
      res = await func();
    }
    if (res) {
      await writeWaitFuncResToFile({
        tempDir: config.tempDir,
        tag,
        isSuccess: true,
      });
    }
  });
};