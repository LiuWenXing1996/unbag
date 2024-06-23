export const message = {
  releaseCurrentBranchUndefined: () => {
    return `你现在没有处在任何分支,请切换到某分支下进行操作`;
  },
  releaseCurrentBranchName: ({
    currentBranchName,
  }: {
    currentBranchName: string;
  }) => {
    return `你现在处在分支 ${currentBranchName}`;
  },
  releaseMainBranchCheckFalse: ({
    currentBranchName,
    mainBranchName,
  }: {
    currentBranchName: string;
    mainBranchName: string;
  }) => {
    return `你现在处在分支 ${currentBranchName},请使用 git checkout ${mainBranchName} 切换到主分支 ${mainBranchName} 操作`;
  },
  releaseMainCheckFalse: (currentBranch: string, mainBranchName: string) => {
    return `你现在在分支 ${currentBranch},请使用 git checkout ${mainBranchName} 切换到主分支 ${mainBranchName} 操作`;
  },
  userConfigFileNotFound: (filePath: string) => {
    return `没有找到配置文件: ${filePath}`;
  },
  configPropertyUndefined: (keyPath: string, configFilePath?: string) => {
    if (!configFilePath) {
      return `配置中的 ${keyPath} 未定义`;
    } else {
      return `配置中的 ${keyPath} 未定义，请检查 ${configFilePath}`;
    }
  },
  releaseUndefinedChangelogFilePathConfig: () => {
    return `changelogFilePath 为 undefined`;
  },
  releaseUndefinedPkgFilePathConfig: () => {
    return `pkgFilePath 为 undefined`;
  },
  releaseBumpNotFoundPkgFile: () => {
    return `没有找到项目配置文件`;
  },
  releaseBumpInputUnValidReleaseAs: (currentValue?: string) => {
    return `releaseAs 必须是一个格式正确的 semvar 版本号, 当前值: ${currentValue}`;
  },
  releaseBumpInputUnValidReleaseType: (currentValue?: string) => {
    return `releaseType 必须是一个跟是正确的 server ReleaseType, 当前值: ${currentValue}`;
  },
  releaseBumpGenUnValidReleaseType: () => {
    return `自动生成 releaseType 失败`;
  },
  releaseBumpGenUnValidVersion: () => {
    return `自动生成 version 失败`;
  },
  releaseCommitMessageUndefined: () => {
    return `CommitMessage 为空，请检查 commitMessageFormat`;
  },
};
