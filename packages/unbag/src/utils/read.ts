import { program } from "commander";
import { watch as watchCommand } from "../commands/watch";
import { transform } from "../commands/transform";
import { clean } from "../commands/clean";
import { checkWaitFuncResByFile } from "./wait-func";
import { parallel } from "../commands/parallel";
import { loadConfigFromFile } from "./config";

export const read = () => {
  program
    .command("transform")
    .description("转换文件")
    .option("-c,--config <string>", "配置文件路径")
    .option("-w,--watch", "启用观察模式")
    .action(async (options) => {
      let { config = "", watch = false } = options;
      const cfg = await loadConfigFromFile({
        root: process.cwd(),
        filePath: config,
      });
      if (!cfg) {
        console.log("没有找到配置文件");
        return;
      }
      if (cfg.transform) {
        if (watch) {
          await watchCommand(cfg.transform);
        } else {
          await transform(cfg.transform);
        }
      } else {
        console.log("transform 未定义");
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
      const cfg = await loadConfigFromFile({
        root: process.cwd(),
        filePath: config,
      });
      if (!cfg) {
        console.log("没有找到配置文件");
        return;
      }
      if (cfg.parallel) {
        await parallel(cfg.parallel);
      } else {
        console.log("parallel 未定义");
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
