import {
  ITransformConfig,
  transform,
  resolveTransformEntry,
} from "./transform";
import { watch as fsWatch } from "chokidar";
import debounce from "debounce-promise";

export const watch = async (config: ITransformConfig) => {
  const entry = resolveTransformEntry(config);
  const watcher = fsWatch(entry);
  const debouncedTransform = debounce(async () => {
    await transform(config);
  }, 100);
  await debouncedTransform();
  watcher.on("all", async (type, file) => {
    console.log("检测到变化，正在重新构建...");
    await debouncedTransform();
    console.log("重新构建完成");
  });
};
