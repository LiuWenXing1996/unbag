import { IBuildConfig, build } from "./build";
import { watch } from "chokidar";
import { isArray } from "lodash";
import debounce from "debounce-promise";

export const dev = async (config: IBuildConfig) => {
  const { entry } = config;
  const entrys = isArray(entry) ? [...entry] : [entry];
  const watcher = watch(entrys);
  const debouncedBuild = debounce(async () => {
    await build(config);
  }, 100);
  await debouncedBuild();
  watcher.on("all", async (type, file) => {
    await debouncedBuild();
  });
};
