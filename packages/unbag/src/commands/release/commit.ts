import { FinalUserConfig } from "../../utils/config";
import { useLog } from "../../utils/log";
import { message } from "../../utils/message";
import { MaybePromise } from "../../utils/types";
import { BumpResult } from "./bump";
import { ReleaseChangelogFileContent } from "./changelog";
import { $ } from "execa";

export interface ReleaseCommitConfig {
  disable?: boolean;
  message?: string;
  messageFormat: (params: {
    config: FinalUserConfig;
    bumpRes: BumpResult;
    changelogRes: ReleaseChangelogFileContent;
    commitFiles: string[];
  }) => MaybePromise<string>;
  filesCollect: (params: {
    config: FinalUserConfig;
    bumpRes: BumpResult;
    changelogRes: ReleaseChangelogFileContent;
  }) => MaybePromise<string[]>;
}

export const ReleaseCommitConfigDefault: ReleaseCommitConfig = {
  messageFormat: async ({ config, bumpRes }) => {
    const { release } = config;
    const { scope } = release;
    return `release${scope ? `(${scope})` : ``}: ${bumpRes?.version}`;
  },
  filesCollect: async ({ config, bumpRes, changelogRes }) => {
    const { release } = config;
    const {
      bump: { versionFileWriteDisable, versionFilePathResolve },
      changelog: {
        fileWriteDisable: changelogFileWriteDisable,
        filePathResolve: changelogFilePathResolve,
      },
    } = release;
    const files: string[] = [];
    if (!versionFileWriteDisable) {
      if (bumpRes.oldVersion !== bumpRes.version) {
        const pkgFileAbsolutePath = await versionFilePathResolve({ config });
        files.push(pkgFileAbsolutePath);
      }
    }
    if (!changelogFileWriteDisable) {
      if (changelogRes.body) {
        const changelogFileAbsolutePath = await changelogFilePathResolve({
          config,
        });
        files.push(changelogFileAbsolutePath);
      }
    }
    return files;
  },
};

export const commit = async ({
  config,
  bumpRes,
  changelogRes,
}: {
  config: FinalUserConfig;
  bumpRes: BumpResult;
  changelogRes: ReleaseChangelogFileContent;
}) => {
  const { release } = config;
  const log = useLog({ config });
  const {
    commit: { disable, message: commitMessage, messageFormat, filesCollect },
  } = release;
  if (disable) {
    log.warn(message.releaseCommitDisable());
    return;
  }
  log.info(message.releaseCommitting());
  const addFiles: string[] = await filesCollect({
    config,
    bumpRes,
    changelogRes,
  });
  if (addFiles.length <= 0) {
    log.warn(message.releaseCommitFilesEmpty());
    return;
  }
  log.info(message.releaseCommitFilesInfo({ files: [...addFiles] }));
  const finalCommitMsg =
    commitMessage ||
    (await messageFormat({
      config,
      bumpRes,
      changelogRes,
      commitFiles: { ...addFiles },
    }));
  if (!finalCommitMsg) {
    throw new Error(message.releaseCommitMessageUndefined());
  }
  log.info(message.releaseCommitMessageInfo({ message: finalCommitMsg }));
  await $`git add ${addFiles.join(" ")}`;
  await $`git commit -m ${finalCommitMsg}`;
  log.info(message.releaseCommitSuccess());
};
