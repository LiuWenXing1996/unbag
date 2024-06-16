import { useExeca } from "./common";

export const getCurrentBranch = async (): Promise<string> => {
  const { $ } = await useExeca();
  const branchName = await $`git rev-parse --abbrev-ref HEAD`;
  return branchName.stdout;
};
