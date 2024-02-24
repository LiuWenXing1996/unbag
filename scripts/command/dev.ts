import { join } from "path";
import { watch } from "chokidar";
import debounce from "debounce-promise";
import { build } from "./build";

export const dev = async () => {
  const root = process.cwd();
  const watcher = watch([join(root, "./src")]);
  const debouncedBuild = debounce(async () => {
    await build();
  }, 100);
  await debouncedBuild();
  watcher.on("all", async (type, file) => {
    await debouncedBuild();
  });
};
