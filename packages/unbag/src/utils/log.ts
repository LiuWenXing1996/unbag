import dayjs from "dayjs";
import { FinalUserConfig, FinalUserConfigSchema } from "./config";
import { z } from "zod";
import { defineZodFunctionWithDefault, wrapperZodLazyResult } from "./common";

export const LogTypeSchema = z.enum(["message", "warn", "error"]);
export type LogType = z.infer<typeof LogTypeSchema>;
export const LogType = LogTypeSchema.enum;

export const LogDataSchema = z.object({
  type: LogTypeSchema,
  content: z.string(),
});

export type LogData = z.infer<typeof LogDataSchema>;

export interface LogConfig {
  disabled: boolean;
  prefix: {
    disabled: boolean;
    color: string;
    name: {
      disabled: boolean;
      content: string;
      gen: (params: { config: FinalUserConfig }) => Promise<string>;
    };
    time: {
      disabled: boolean;
      format: string;
      gen: (params: { config: FinalUserConfig }) => Promise<string>;
    };
    gen: (params: { config: FinalUserConfig }) => Promise<string>;
  };
  console: (params: {
    config: FinalUserConfig;
    data: LogData;
  }) => Promise<string>;
}

export const LogConfigSchema: z.ZodSchema<LogConfig> = z.lazy(() =>
  wrapperZodLazyResult(
    z
      .object({
        disabled: z.boolean().default(false),
        prefix: z
          .object({
            disabled: z.boolean().default(false),
            color: z.string().default("#ff0000"),
            name: z
              .object({
                disabled: z.boolean().default(false),
                content: z.string().default("unbag"),
                gen: defineZodFunctionWithDefault(
                  z
                    .function()
                    .args(
                      z.object({
                        config: FinalUserConfigSchema,
                      })
                    )
                    .returns(z.promise(z.string())),
                  async ({ config }) => {
                    const {
                      log: {
                        prefix: {
                          name: { content },
                        },
                      },
                    } = config;
                    return content;
                  }
                ),
              })
              .default({}),
            time: z
              .object({
                disabled: z.boolean().default(false),
                format: z.string().default("HH:mm:s"),
                gen: defineZodFunctionWithDefault(
                  z
                    .function()
                    .args(
                      z.object({
                        config: FinalUserConfigSchema,
                      })
                    )
                    .returns(z.promise(z.string())),
                  async ({ config }) => {
                    const {
                      log: {
                        prefix: {
                          time: { format },
                        },
                      },
                    } = config;
                    return dayjs().format(format);
                  }
                ),
              })
              .default({}),
            gen: defineZodFunctionWithDefault(
              z
                .function()
                .args(
                  z.object({
                    config: FinalUserConfigSchema,
                  })
                )
                .returns(z.promise(z.string())),
              async ({ config }) => {
                const {
                  log: {
                    prefix: { name, time },
                  },
                } = config;
                const list: string[] = await Promise.all([
                  name.disabled ? "" : await name.gen({ config }),
                  time.disabled ? "" : await time.gen({ config }),
                ]);
                return list.join("-");
              }
            ),
          })
          .default({}),
        console: defineZodFunctionWithDefault(
          z
            .function()
            .args(
              z.object({
                config: FinalUserConfigSchema,
                data: LogDataSchema,
              })
            )
            .returns(z.promise(z.string())),
          async ({ config, data: { type, content } }) => {
            const {
              log: { prefix },
            } = config;
            const prefixContent = prefix.disabled
              ? ""
              : await prefix.gen({ config });
            const { default: chalk } = await import("chalk");
            if (type === LogType.error) {
              console.error(
                prefix.disabled
                  ? ""
                  : chalk.hex(prefix.color)(prefixContent) + content
              );
            }
            if (type === LogType.message) {
              console.log(
                prefix.disabled
                  ? ""
                  : chalk.hex(prefix.color)(prefixContent) + content
              );
            }
            if (type === LogType.warn) {
              console.warn(
                prefix.disabled
                  ? ""
                  : chalk.hex(prefix.color)(prefixContent) + content
              );
            }
            return content;
          }
        ),
      })
      .default({})
  )
);

export const useLog = ({ config }: { config: FinalUserConfig }) => {
  return async (data: LogData) => {
    const {
      log: { console, disabled },
    } = config;
    if (disabled) {
      return;
    }
    await console({ config, data });
  };
};
