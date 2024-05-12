import { Plugin, PluginOutputFile } from "../utils/plugin";
import ts from "typescript";
import path from "../utils/path";

const defaultDtsCompilerOptions: ts.CompilerOptions = {
  emitDeclarationOnly: true,
  declaration: true,
  composite: false,
  noEmit: false,
};

const genDts = (params: {
  fileNames: string[];
  compilerOptions?: ts.CompilerOptions;
  noLogDiagnosticErrors?: boolean;
}) => {
  let { fileNames, compilerOptions, noLogDiagnosticErrors } = params;
  let outDir = "./temp/dist/types";
  compilerOptions = {
    ...compilerOptions,
    ...defaultDtsCompilerOptions,
    outDir,
  };
  let program = ts.createProgram(fileNames, compilerOptions);
  const dtsFiles: {
    path: string;
    content: string;
  }[] = [];
  let emitResult = program.emit(undefined, (fileName: string, text: string) => {
    const filePath = path.relative(outDir, fileName);
    dtsFiles.push({
      path: filePath,
      content: text,
    });
  });
  if (!noLogDiagnosticErrors) {
    let allDiagnostics = ts
      .getPreEmitDiagnostics(program)
      .concat(emitResult.diagnostics);
    allDiagnostics.forEach((diagnostic) => {
      if (diagnostic.file) {
        let { line, character } = ts.getLineAndCharacterOfPosition(
          diagnostic.file,
          diagnostic.start!
        );
        let message = ts.flattenDiagnosticMessageText(
          diagnostic.messageText,
          "\n"
        );
        console.log(
          `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
        );
      } else {
        console.log(
          ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
        );
      }
    });
  }

  return dtsFiles;
};

const tryGetTsCompilerOptionsFromTsConfigJsonFile = (
  configFilePath?: string
) => {
  if (!configFilePath) {
    const currentDir = process.cwd();
    configFilePath = ts.findConfigFile(
      currentDir,
      ts.sys.fileExists,
      "tsconfig.json"
    );
  }
  if (configFilePath) {
    const { config } = ts.readConfigFile(configFilePath, ts.sys.readFile);
    if (config.compilerOptions) {
      const { options } = ts.convertCompilerOptionsFromJson(
        config?.compilerOptions,
        ".",
        configFilePath
      );
      return options;
    }
  }
};
const supportExtensions = [
  ".ts",
  ".tsx",
  ".d.ts",
  ".js",
  ".jsx",
  ".cts",
  ".d.cts",
  ".cjs",
  ".mts",
  ".d.mts",
  ".mjs",
];
export const TsToDtsPlugin = (options?: {
  configFile?: string;
  compilerOptions?: ts.CompilerOptions;
  noLogDiagnosticErrors?: boolean;
}): Plugin => {
  return {
    name: "ts-to-dts",
    match: (file) => {
      const extname = path.extname(file.path);
      return supportExtensions.includes(extname);
    },
    beforeTransform(input, buildConfig) {
      const tsCompilerOptionsFromFile =
        tryGetTsCompilerOptionsFromTsConfigJsonFile(options?.configFile);
      const compilerOptions = {
        ...tsCompilerOptionsFromFile,
        ...options?.compilerOptions,
      };

      const files = genDts({
        fileNames: input
          .filter((e) => {
            const extname = path.extname(e.path);
            return supportExtensions.includes(extname);
          })
          .map((e) => path.join(buildConfig.entry, e.path)),
        compilerOptions: compilerOptions,
        noLogDiagnosticErrors: options?.noLogDiagnosticErrors,
      });

      const outputFiles: PluginOutputFile[] = files.map((e) => {
        return {
          content: e.content,
          path: e.path,
        };
      });
      return outputFiles;
    },
  };
};
