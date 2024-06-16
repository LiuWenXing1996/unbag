import { FinalUserConfig } from "./config";
import { z } from "zod";

export const rootSchema = z.object({
  userId: z.number(),
  id: z.number(),
  title: z.string(),
  completed: z.boolean(),
});

export const propsSchema = z.object({
  name: z.string(),
  priority: z.boolean().optional(),
});

// 全部使用 zod 来定义 , 包括 default
const logConfigSchema = z
  .object({
    disabled: z.boolean().default(false),
    prefix: z
      .object({
        disabled: z.boolean().default(false),
        color: z.string().min(1).default("red"),
        name: z
          .object({
            disabled: z.boolean().default(false),
            content: z.string().default("unbag"),
          })
          .default({}),
        time: z
          .object({
            disabled: z.boolean().default(false),
            format: z.string().default("HH:mm:ss"),
          })
          .default({}),
      })
      .default({}),
    console: z
      .function()
      .args(
        z.object({
          // TODO:使用 finalUserConfig 替换
          config: rootSchema,
        })
      )
      .returns(z.promise(z.void()))
      .default(async () => {}),
  })
  .default({});

export type LogConfig = z.infer<typeof logConfigSchema>;

export enum LogType {
  message = "message",
  warn = "warn",
  error = "error",
}

export const logDefaultConfig: LogConfig = {
  disabled: false,
  prefix: {
    disabled: false,
    color: "s",
    name: {
      disabled: false,
      content: "unbag",
    },
    time: {
      disabled: false,
      format: "HH:mm:ss",
    },
  },
  console: function (): void {
    throw new Error("Function not implemented.");
  },
};

export const log = async (config: FinalUserConfig) => {
  const {
    log: { disabled },
  } = config;
  if (disabled) {
    return;
  }
};
