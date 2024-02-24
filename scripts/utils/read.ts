import { program } from "commander";
import { dev } from "../command/dev";
import { build } from "../command/build";
// import { clean } from "../command/clean";

export const read = () => {
  console.log("...")
  program.command("build").action(() => {
    build();
  });

  program.command("dev").action(() => {
    console.log(".dev.")
    dev();
  });

  // program.command("clean").action(() => {
  //   clean();
  // });

  program.parse();
};
