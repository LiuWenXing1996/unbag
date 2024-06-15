import { ReleaseChangelogFileContent } from ".";
import { FinalUserConfig } from "../../utils/config";
import { BumpResult } from "./bump";

export interface TagData {
  bumpRes: BumpResult;
  changelogRes: ReleaseChangelogFileContent;
}

export const tag = async (config: FinalUserConfig, data: TagData) => {
  const { release } = config;
  const { tagPrefix, tagForce, tagMessageFormat } = release;
  const { bumpRes } = data;
  const { $ } = await import("execa");
  const tagName = `${tagPrefix}${bumpRes.version}`;
  const tagMessage = await tagMessageFormat(config, data);
  await $`git tag -a ${tagName} ${tagForce ? ["-f"] : []} -m ${tagMessage}`;
  // TODO:继续实现 tag
};
