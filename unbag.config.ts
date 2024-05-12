import { defineConfig } from "unbag";

export default defineConfig({
  parallel: {
    commands: [
      {
        name: "unbag",
        npmScript: "pnpm --filter 'unbag' dev",
      },
      {
        name: "unbag-docs",
        npmScript: "pnpm --filter 'unbag-docs' dev",
      },
    ],
  },
});
