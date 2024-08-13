import { FinalUserConfig } from "../../utils/config";
// import gitCz from "commitizen/dist/cli/git-cz";
import commitizen from "commitizen";
import path from "node:path";
import load from "@commitlint/load";
import { RuleConfigSeverity, type UserConfig } from "@commitlint/types";
import { createRequire } from "node:module";
import { useRoot } from "@/utils/common";
import { useFs } from "@/utils/fs";
import { transform as esbuildTransform } from "esbuild";
import { gitCz } from "./git-cz";
const require = createRequire(import.meta.url);
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
  // TODO:还是直接可配比较好，因为有些默认配置是需要的，比如 release
  /**
   * 直接重写gitCz的一些 boot bootstrap 逻辑，还有
   * @commitlint/load 的一些逻辑，不然不太好合并
   */
};
export const commit = async (params: { finalUserConfig: FinalUserConfig }) => {
  const { finalUserConfig } = params;
  const {
    tempDir,
    commit: { lint },
  } = finalUserConfig;
  await gitCz({ finalUserConfig });
  //   const fs = useFs();
  //   const rootPath = useRoot({ finalUserConfig });
  //   const commitTempDir = rootPath
  //     .resolve({
  //       next: tempDir,
  //     })
  //     .resolve({
  //       next: "./commit",
  //     });

  //   const tempLintConfigFile = {
  //     path: commitTempDir.resolve({ next: "./temp-lint-config.js" }),
  //     content: `
  // export default {}
  //     `,
  //   };
  //   await fs.outputFile(
  //     tempLintConfigFile.path.content,
  //     tempLintConfigFile.content
  //   );
  //   const lintConfig = await load(
  //     //@ts-ignore
  //     lint,
  //     { file: tempLintConfigFile.path.content, cwd: rootPath.content }
  //   );

  //   const tempPrompterFile = {
  //     path: commitTempDir.resolve({ next: "./temp-prompter-config.js" }),
  //     content: (
  //       await esbuildTransform(
  //         `
  // import load from '${deps["@commitlint/load"]}';
  // export function prompter(
  // 	inquirerIns: {
  // 		prompt(questions: DistinctQuestion[]): Promise<Answers>;
  // 	},
  // 	commit: Commit
  // ): void {
  // 	load().then(({rules, prompt = {}}) => {
  // 		process(rules, prompt, inquirerIns).then(commit);
  // 	});
  // }
  //     `,
  //         {
  //           loader: "ts",
  //           format: "cjs",
  //         }
  //       )
  //     ).code,
  //   };

  // const bootstrap = gitCz.bootstrap;
  // const a = require.resolve("commitizen");
  // const b = path.resolve(a, "../../");
  // console.log({ a, b });
  // bootstrap({
  //   cliPath: b,
  //   // this is new
  //   config: {
  //     path: "@commitlint/cz-commitlint",
  //   },
  // });
};
