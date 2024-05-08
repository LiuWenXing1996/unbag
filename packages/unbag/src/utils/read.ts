import { program } from "commander";
import { watch } from "../commands/watch";
import { build, loadBuildConfigFromFile } from "../commands/build";
import { clean } from "../commands/clean";
import { checkWaitFuncResByFile } from "./wait-func";
import { loadParallelConfigFromFile, parallel } from "../commands/parallel";

export const read = () => {
  program
    .command("build")
    .description("构建命令")
    .option("-c,--config <string>", "配置文件路径")
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

  program
    .command("watch")
    .description("观察模式")
    .option("-c,--config <string>", "配置文件路径")
    .action(async (options) => {
      let { config = "" } = options;
      const buildConfig = await loadBuildConfigFromFile({
        root: process.cwd(),
        filePath: config,
      });
      if (buildConfig) {
        await watch(buildConfig);
      } else {
        console.log("没有找到配置文件");
      }
    });

  program.command("clean").action(() => {
    clean();
  });

  program
    .command("parallel")
    .description("运行多个npm script")
    .option("-c,--config <string>", "配置文件路径")
    .action(async (options) => {
      let { config = "" } = options;
      const parallelConfig = await loadParallelConfigFromFile({
        root: process.cwd(),
        filePath: config,
      });
      if (parallelConfig) {
        await parallel(parallelConfig);
      } else {
        console.log("没有找到配置文件");
      }
    });

  program
    .command("wait")
    .description("等待某个函数运行完成")
    .option("-n,--name <string>", "命令名称")
    .option("-tg,--tag <string>", "函数运行标志")
    .option("-td,--tempDir <string>", "临时文件夹")
    .option("-i,--interval <string>", "检测间隔")
    .option("-tm,--timeout <string>", "超时时间")
    .action(async (options) => {
      const { name = "", tag = "", interval, timeout, tempDir } = options;
      let isSuccess = false;
      if (tag && name) {
        isSuccess = await checkWaitFuncResByFile({
          name,
          tag,
          interval,
          timeout,
          tempDir,
        });
      }
      console.log("访问标识完成", isSuccess);
      if (isSuccess) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    });

  program.parse();
};
