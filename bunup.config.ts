import { defineWorkspace } from "bunup";

// https://bunup.dev/docs/guide/workspaces

export default defineWorkspace([
  {
    name: "logixlysia",
    root: "packages/logixlysia",
    config: {
      outDir: "dist",
      entry: ["./src/index.ts"],
      dts: true,
      minify: true,
      sourcemap: "inline",
      external: ["elysia", "chalk", "pino", "pino-pretty"],
      format: ["esm", "cjs"],
    },
  },
]);
