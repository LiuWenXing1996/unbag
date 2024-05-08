import { IBuildConfig, build, resolveBuildEntry } from "./build";
import { watch as fsWatch } from "chokidar";
import debounce from "debounce-promise";

export const watch = async (config: IBuildConfig) => {
  const entry = resolveBuildEntry(config);
  const watcher = fsWatch(entry);
  const debouncedBuild = debounce(async () => {
    await build(config);
  }, 100);
  await debouncedBuild();
  watcher.on("all", async (type, file) => {
    console.log("检测到变化，正在重新构建...");
    await debouncedBuild();
    console.log("重新构建完成");
  });
};
