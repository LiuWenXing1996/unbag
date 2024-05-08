import { defineParallelConfig } from "unbag";

export default defineParallelConfig({
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
});
