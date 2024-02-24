import { IPkg, findAllPkgs } from "../utils/findAllpackages";
import { concurrentlyAsync, toLongCommond } from "../utils/concurrently";
import { clean } from "./clean";
import { resolve } from "path";

export const dev = async () => {
  await clean();
  const allPkgs = await findAllPkgs();
  const getEndSignal = (pkg: IPkg) => {
    const distPkgs = [
      "@vue-cook/core",
      "@vue-cook/ui",
      "@vue-cook/cli",
      "@vue-cook/schema-bundler",
    ];
    if (distPkgs.includes(pkg.name)) {
      return `${resolve(pkg.path, "./dist")}`;
    }
    if (pkg.name === "server-demo") {
      return "http-get://localhost:3000"
    }
    if (pkg.name === "studio-demo") {
      return "http-get://localhost:5173"
    }
  };
  const commands = allPkgs.map((e, index) => {
    let command = "";
    if (index > 0) {
      const prePkg = allPkgs[index - 1];
      if (prePkg) {
        const endSignal = getEndSignal(prePkg);
        if (endSignal) {
          command += `wait-on '${endSignal}' && `;
        }
      }
    }
    command += `pnpm --filter '${e.name}' dev`;
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
