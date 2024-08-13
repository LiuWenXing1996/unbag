import { FinalUserConfig } from "@/utils/config";
import { gitCz } from "./git-cz";

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
