import { TransformConfig, transform, resolveTransformEntry } from "./transform";
import { watch as fsWatch } from "chokidar";
import debounce from "debounce-promise";

export const watch = async (config: TransformConfig) => {
  const entry = resolveTransformEntry(config);
  const watcher = fsWatch(entry);
  const debouncedTransform = debounce(async () => {
    await transform(config);
  }, 100);
  await debouncedTransform();
  watcher.on("all", async (type, file) => {
    console.log("检测到变化，正在重新转换文件...");
    await debouncedTransform();
    console.log("文件转换完成");
  });
  console.log("观察模式已启动");
};
