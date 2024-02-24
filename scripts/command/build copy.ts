import { findAllPkgs } from "../utils/findAllpackages";
import { concurrentlyAsync, toLongCommond } from "../utils/concurrently";
import { resolve } from "path";
import { clean } from "./clean";

export const build = async () => {
  await clean();
  const allPkgs = await findAllPkgs();
  const commands = allPkgs.map((e, index) => {
    let command = "";
    if (index > 0) {
      const prePkg = allPkgs[index - 1];
      if (prePkg) {
        command += `wait-on '${resolve(prePkg.path, "./dist")}' && `;
      }
    }
    command += `pnpm --filter "${e.name}" build`;
    return {
      command: command,
      name: e.name,
    };
  });
  console.log("commands", commands);
  const longCommands = toLongCommond(commands);
  console.log("longCommands", longCommands);
  await concurrentlyAsync([longCommands], { raw: true });
};
