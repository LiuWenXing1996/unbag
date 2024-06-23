import { useExeca } from "./common";
import { MaybePromise } from "./types";

export interface GitConfig {
  currentBranchGet: () => MaybePromise<string | undefined>;
  currentBranchStatusGet: () => MaybePromise<string | undefined>;
}
export const GitConfigDefault: GitConfig = {
  currentBranchGet: async () => {
    const { $ } = await useExeca();
    const { stdout } = await $`git rev-parse --abbrev-ref HEAD`;
    return stdout;
  },
  currentBranchStatusGet: async () => {
    const { $ } = await useExeca();
    const { stdout } = await $`git status -s`;
    return stdout;
  },
};

export const getCurrentBranch = async (): Promise<string> => {
  const { $ } = await useExeca();
  const branchName = await $`git rev-parse --abbrev-ref HEAD`;
  return branchName.stdout;
};
