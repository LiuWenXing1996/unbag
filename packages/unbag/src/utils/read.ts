import { program } from "commander";
import { dev } from "../commands/dev";
import { build } from "../commands/build";
import { clean } from "../commands/clean";
import { loadBuildConfigFromFile } from "./loadBuildConfigFromFile";

export const read = () => {
  program
    .command("build")
    .description("构建命令")
    .option("-c,--config <string>", "cook.config.json配置文件路径")
    .action(async (options) => {
      let { config = "" } = options;
      const buildConfig = await loadBuildConfigFromFile({
        root: process.cwd(),
        filePath: config,
      });
      if (buildConfig) {
        await build(buildConfig);
      } else {
        console.log("没有找到配置文件");
      }
    });

  // program.command("dev").action(() => {
  //   dev();
  // });

  program.command("clean").action(() => {
    clean();
  });

  program.parse();
};
