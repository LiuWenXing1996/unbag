import dayjs from "dayjs";
import { FinalUserConfig } from "./config";
import chalk from "chalk";

export enum LogTypeEnum {
  Info = "Info",
  Warn = "Warn",
  Error = "Error",
}

export interface LogConfig {
  disabled: boolean;
  console: (params: {
    config: FinalUserConfig;
    type: LogTypeEnum;
    message: string;
  }) => void;
}

export const LogConfigDefault: LogConfig = {
  disabled: false,
  console: ({ config, type, message }) => {
    if (type === LogTypeEnum.Error) {
      console.log(`${chalk.red(`[error]`)} ${message}`);
    }
    if (type === LogTypeEnum.Info) {
      console.log(`${message}`);
    }
    if (type === LogTypeEnum.Warn) {
      console.log(`${chalk.yellow(`[warn]`)} ${message}`);
    }
  },
};

export const useLog = ({ config }: { config: FinalUserConfig }) => {
  const _console = ({
    type,
    message,
  }: {
    type: LogTypeEnum;
    message: string;
  }) => {
    const {
      log: { console, disabled },
    } = config;
    if (disabled) {
      return;
    }
    console({ config, type, message });
  };
  const info = (message: string) =>
    _console({ type: LogTypeEnum.Info, message });
  const warn = (message: string) =>
    _console({ type: LogTypeEnum.Warn, message });
  const error = (message: string) =>
    _console({ type: LogTypeEnum.Error, message });
  return { info, warn, error };
};
