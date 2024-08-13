import { type FinalUserConfig } from "@/utils/config";
import { useGit } from "@/utils/git";
import { useMessage } from "@/utils/message";
import { getPrompter } from "./prompter";
import { createRequire } from "node:module";
import { usePath } from "@/utils/path";
import { loadCommitLintConfig } from "./config";
import { commit as czCommit } from "commitizen/dist/commitizen";
import inquirer from "inquirer";
import childProcess from "child_process";
import { useLog } from "@/utils/log";
const require = createRequire(import.meta.url);

export const gitCz = async (params: { finalUserConfig: FinalUserConfig }) => {
  const { finalUserConfig } = params;
  const path = usePath();
  const log = useLog({ finalUserConfig });
  const czCommitlintPath = require.resolve("@commitlint/cz-commitlint");
  const processJsFile = path.resolve(czCommitlintPath, "../lib/Process");
  const process = await import(processJsFile);
  const lintConfig = await loadCommitLintConfig({ finalUserConfig });
  const prompter = (inquirerIns, commit) => {
    process(lintConfig.rules, lintConfig.prompt, inquirerIns).then(commit);
  };
  console.log({ lintConfig });
  const message = useMessage({ locale: finalUserConfig.locale });
  const git = useGit();
  const gitRootPath = await git.gitRootPathGet();
  const stageFiles = await git.stageFilesGet();
  console.log({ stageFiles });
  if (stageFiles.length <= 0) {
    log.error(message.commit.branch.stageFiles.empty());
    return;
  }

  //   czCommit(
  //     inquirer,
  //     gitRootPath,
  //     prompter,
  //     {
  //       disableAppendPaths: true,
  //       emitData: true,
  //       quiet: false,
  //     },
  //     function (error) {
  //       if (error) {
  //         throw error;
  //       }
  //     }
  //   );
};
