import commitAndTagVersion from "commit-and-tag-version";
//@ts-ignore
import type { Commit } from "conventional-commits-parser";
//@ts-ignore
import type { Bumper } from "conventional-recommended-bump";
// import { Bumper } from "conventional-recommended-bump";

// console.log({ Bumper });

export interface ReleaseConfig {
  tagPrefix?: string;
  scope?: string;
}

const getCommits = async (bumper: Bumper) => {
  //@ts-ignore
  const commitsStream = bumper.commitsGetter();
  const commits: Commit[] = [];
  let commit: Commit;

  for await (commit of commitsStream) {
    commits.push(commit);
  }
  return commits;
};

export const bump = async () => {
  const { Bumper } = await import("conventional-recommended-bump");
  const bumper = new Bumper();
  const presetPath = require.resolve(
    "conventional-changelog-conventionalcommits"
  );
  bumper.loadPreset(presetPath);
  const rrr = await getCommits(bumper);
  console.log(rrr);
  const res = await bumper.bump();
  return res;
};

// TODO 实现 scope?
// 还有commit？
// 甚至 test?
export const release = async (config: ReleaseConfig) => {
  const { tagPrefix, scope } = config;
  const res = await bump();
  console.log({ res });
  // if (scope) {
  // }
  // await commitAndTagVersion({
  //   tagPrefix,
  // });
};
