import { FinalUserConfig } from "@/utils/config";
import load from "@commitlint/load";
import { RuleConfigSeverity, type UserConfig } from "@commitlint/types";
import { useRoot } from "@/utils/common";
import { useFs } from "@/utils/fs";
export interface CommitConfig {
  lint: UserConfig;
}
export const CommitConfigDefault: CommitConfig = {
  lint: {
    rules: {
      "type-enum": () => {
        return [
          RuleConfigSeverity.Error,
          "always",
          [
            "build",
            "chore",
            "ci",
            "docs",
            "feat",
            "fix",
            "perf",
            "refactor",
            "revert",
            "style",
            "test",
            "release",
          ],
        ];
      },
    },
    prompt: {
      questions: {
        type: {
          enum: {
            release: {
              description: "release a version",
            },
          },
        },
      },
    },
  },
};

export const loadCommitLintConfig = async (params: {
  finalUserConfig: FinalUserConfig;
}) => {
  const { finalUserConfig } = params;
  const {
    tempDir,
    commit: { lint },
  } = finalUserConfig;
  const fs = useFs();
  const rootPath = useRoot({ finalUserConfig });
  const commitTempDir = rootPath
    .resolve({
      next: tempDir,
    })
    .resolve({
      next: "./commit",
    });

  const tempLintConfigFile = {
    path: commitTempDir.resolve({ next: "./temp-lint-config.js" }),
    content: `
  export default {}
      `,
  };
  await fs.outputFile(
    tempLintConfigFile.path.content,
    tempLintConfigFile.content
  );
  const lintConfig = await load(
    //@ts-ignore
    lint,
    { file: tempLintConfigFile.path.content, cwd: rootPath.content }
  );
  return lintConfig;
};
