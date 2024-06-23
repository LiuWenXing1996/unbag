import { type FinalUserConfig } from "../../utils/config";
import { LogType, useLog } from "../../utils/log";
import { message } from "../../utils/message";

export const getGitBranch = async () => {
  const { $ } = await import("execa");
  const { stdout } = await $`git rev-parse --abbrev-ref HEAD`;
  return stdout;
};

export interface ReleaseBranchConfig {
  mainName: string;
  mainCheckDisable: boolean;
  cleanCheckDisable: boolean;
}

export type ReleaseBranchResult =
  | {
      checkPass: true;
      currentBranchName: string;
    }
  | {
      checkPass: false;
      currentBranchName?: string;
    };

export const ReleaseBranchConfigDefault: ReleaseBranchConfig = {
  mainName: "main",
  mainCheckDisable: false,
  cleanCheckDisable: false,
};

export const branch = async ({
  config,
}: {
  config: FinalUserConfig;
}): Promise<ReleaseBranchResult> => {
  const {
    release: {
      branch: { mainCheckDisable, mainName, cleanCheckDisable },
    },
    git: { currentBranchGet, currentBranchStatusGet },
  } = config;
  const log = useLog({ config });
  const currentBranchName = await currentBranchGet();
  if (!currentBranchName) {
    await log({
      type: LogType.error,
      content: message.releaseCurrentBranchUndefined(),
    });
    return {
      checkPass: false,
    };
  }
  await log({
    type: LogType.message,
    content: message.releaseCurrentBranchName({ currentBranchName }),
  });
  if (!mainCheckDisable) {
    if (currentBranchName !== mainName) {
      await log({
        type: LogType.error,
        content: message.releaseMainBranchCheckFalse({
          currentBranchName,
          mainBranchName: mainName,
        }),
      });
      return {
        currentBranchName,
        checkPass: false,
      };
    }
  }
  if (!cleanCheckDisable) {
    const currentBranchStatus = await currentBranchStatusGet();
    if (currentBranchStatus) {
      return {
        currentBranchName,
        checkPass: false,
      };
    }
  }
  return {
    currentBranchName,
    checkPass: true,
  };
};
