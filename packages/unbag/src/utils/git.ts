import { $ } from "execa";

export const useGit = () => {
  const currentBranchGet = async () => {
    const { stdout } = await $`git rev-parse --abbrev-ref HEAD`;
    return stdout;
  };
  const currentBranchStatusGet = async () => {
    const { stdout } = await $`git status -s`;
    return stdout;
  };
  return { currentBranchGet, currentBranchStatusGet };
};
