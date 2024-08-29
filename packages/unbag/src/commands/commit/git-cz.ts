import { type FinalUserConfig } from "@/utils/config";
import { useGit } from "@/utils/git";
import { useMessage } from "@/utils/message";
import { getPrompter } from "./prompter";
import { createRequire } from "node:module";
import { usePath } from "@/utils/path";
import { loadCommitLintConfig } from "./config";
// import { commit as czCommit } from "commitizen/dist/commitizen";
import inquirer from "inquirer";
import { useLog } from "@/utils/log";
const require = createRequire(import.meta.url);

const useCommitizenCommit = async () => {
  const path = usePath();
  const commitizenPath = require.resolve("commitizen");
  console.log({ commitizenPath });
  const commitizenCommitJsFile = path.resolve(commitizenPath, "../commitizen");
  const process = require(commitizenCommitJsFile);
  // console.log({ aaa });
  // const process = (await import(commitizenCommitJsFile)).default;
  console.log({ process });
  return process.commit;
};

export const gitCz = async (params: { finalUserConfig: FinalUserConfig }) => {
  const czCommit = await useCommitizenCommit();
  // throw "ss";
  const { finalUserConfig } = params;
  const path = usePath();
  const log = useLog({ finalUserConfig });
  const czCommitlintPath = require.resolve("@commitlint/cz-commitlint");
  const processJsFile = path.resolve(czCommitlintPath, "../lib/Process.js");
  const process = (await import(processJsFile)).default;
  console.log({ process });
  const lintConfig = await loadCommitLintConfig({ finalUserConfig });
  const prompter = (inquirerIns, commit) => {
    process(lintConfig.rules, lintConfig.prompt, inquirerIns).then(commit);
  };
  console.log({ lintConfig });
  const message = useMessage({ locale: finalUserConfig.locale });
  const git = useGit();
  const gitRootPath = await git.gitRootPathGet();
  const stageFiles = await git.stageFilesGet();
  console.log({ stageFiles, gitRootPath });
  if (stageFiles.length <= 0) {
    log.error(message.commit.branch.stageFiles.empty());
    return;
  }
  // FIXME:husky lint error
  /**
   * husky 的lint似乎需要保持父目录，子项目目录出现配置会出问题的
   */

  czCommit(
    inquirer,
    gitRootPath,
    prompter,
    {
      disableAppendPaths: true,
      emitData: true,
      quiet: false,
    },
    function (error) {
      if (error) {
        throw error;
      }
    }
  );
};
