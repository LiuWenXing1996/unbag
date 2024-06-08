export const message = {
  releaseUndefinedPkgFileConfig: () => {
    return `readPkgFile 为 undefined`;
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
};
