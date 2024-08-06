import { FinalUserConfig } from "../../utils/config";
import gitCz from "commitizen/dist/cli/git-cz";
import commitizen from "commitizen";
import path from "node:path";
import load from "@commitlint/load";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
export interface CommitConfig {
  lintConfigFile: string;
}
export const CommitConfigDefault: CommitConfig = {
  // 还是直接可配比较好，因为有些默认配置是需要的，比如 release
  lintConfigFile: "commitlint.config.ts"
};
export const commit = async ({
  config
}: {
  config: FinalUserConfig;
}) => {
  const {
    root,
    commit: {
      lintConfigFile
    }
  } = config;
  const lintConfig = await load({});
  const bootstrap = gitCz.bootstrap;
  const a = require.resolve("commitizen");
  const b = path.resolve(a, "../../");
  bootstrap({
    cliPath: b,
    // this is new
    config: {
      path: "@commitlint/cz-commitlint"
    }
  });
};