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
  prefix: {
    disabled: boolean;
    color: string;
    name: {
      disabled: boolean;
      content: string;
      gen: (params: { config: FinalUserConfig }) => string;
    };
    time: {
      disabled: boolean;
      format: string;
      gen: (params: { config: FinalUserConfig }) => string;
    };
    gen: (params: { config: FinalUserConfig }) => string;
  };
  console: (params: {
    config: FinalUserConfig;
    type: LogTypeEnum;
    message: string;
  }) => void;
}

export const LogConfigDefault: LogConfig = {
  disabled: false,
  prefix: {
    disabled: false,
    color: "#ff0000",
    name: {
      disabled: false,
      content: "unbag",
      gen: ({ config }) => {
        const {
          log: {
            prefix: {
              name: { content },
            },
          },
        } = config;
        return content;
      },
    },
    time: {
      disabled: false,
      format: "HH:mm:s",
      gen: ({ config }) => {
        const {
          log: {
            prefix: {
              time: { format },
            },
          },
        } = config;
        return dayjs().format(format);
      },
    },
    gen: ({ config }) => {
      const {
        log: {
          prefix: { name, time },
        },
      } = config;
      const list: string[] = [
        name.disabled ? "" : name.gen({ config }),
        time.disabled ? "" : time.gen({ config }),
      ];
      return list.join("-");
    },
  },
  console: ({ config, type, message }) => {
    const {
      log: { prefix },
    } = config;
    const prefixContent = prefix.disabled ? "" : prefix.gen({ config });
    if (type === LogTypeEnum.Error) {
      console.error(
        prefix.disabled ? "" : chalk.hex(prefix.color)(prefixContent) + message
      );
    }
    if (type === LogTypeEnum.Info) {
      console.log(
        prefix.disabled ? "" : chalk.hex(prefix.color)(prefixContent) + message
      );
    }
    if (type === LogTypeEnum.Warn) {
      console.warn(
        prefix.disabled ? "" : chalk.hex(prefix.color)(prefixContent) + message
      );
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
