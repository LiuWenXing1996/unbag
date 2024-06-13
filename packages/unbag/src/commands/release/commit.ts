import { ReleaseChangelogFileContent } from ".";
import { FinalUserConfig } from "../../utils/config";
import { message } from "../../utils/message";
import { BumpResult } from "./bump";

export async function branchStatus() {
  const { execa } = await import("execa");
  const { stdout } = await execa("git status -s");
  return stdout;
}

export const branchIsClean = async () => {
  const branchStatusInfo = await branchStatus();
  if (branchStatusInfo) {
    return false;
  }
  return true;
};

export interface CommitData {
  bumpRes?: BumpResult;
  changelogRes?: ReleaseChangelogFileContent;
}
export const commit = async (
  config: FinalUserConfig,
  data: CommitData = {}
) => {
  const { release } = config;
  const { commitMessage, commitMessageFormat, commitFilesCollect } = release;

  const finalCommitMsg =
    commitMessage || (await commitMessageFormat(config, data));
  if (!finalCommitMsg) {
    throw new Error(message.releaseCommitMessageUndefined());
  }
  const addFiles: string[] = await commitFilesCollect(config, data);
  if (addFiles.length < 0) {
    return;
  }
  const { execa } = await import("execa");
  await execa(`git add ${addFiles.join(" ")}`);
  await execa(`git commit -m ${finalCommitMsg}`);
};
