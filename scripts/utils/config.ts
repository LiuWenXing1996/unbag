import { join, resolve } from "node:path";
import { MaybeFunction, MaybePromise } from ".";

export interface IPackageConfigItem {
  path: string;
  commands: {
    dev: {
      command: (config: IPackageConfigItem) => MaybePromise<string>;
      endSignal: (config: IPackageConfigItem) => MaybePromise<string>;
    };
    build: {
      command: (config: IPackageConfigItem) => MaybePromise<string>;
      endSignal: (config: IPackageConfigItem) => MaybePromise<string>;
    };
    clean: {
      command: (config: IPackageConfigItem) => Promise<boolean>;
    };
  };
}

export const config: IPackageConfigItem[] = [
  {
    path: join(__dirname, "/packages/ui"),
    commands: {
      dev: {
        command: () => "dev",
        endSignal: (config) => {
          return `${resolve(config.path, "./dist")}`;
        },
      },
      build: {
        command: () => "build",
        endSignal: (config) => {
          return `${resolve(config.path, "./dist")}`;
        },
      },
      clean: {
        command: async () => {
          return true;
        },
      },
    },
  },
];
