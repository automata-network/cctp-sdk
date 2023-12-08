import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import terser from "@rollup/plugin-terser";
import json from "@rollup/plugin-json";

const NODE_ENV = process.env.NODE_ENV;

const config = [
  {
    input: "src/index.ts",
    output: [
      {
        file: "dist/index.mjs",
        format: "es",
        sourcemap: true,
      },
      {
        file: "dist/index.js",
        format: "cjs",
        sourcemap: true,
      },
    ],
    external: ["lodash/merge", "ethers", "ethers/lib/utils"],
    plugins: [
      json(),
      typescript(),
      NODE_ENV === "production" ? terser() : undefined,
    ].filter((item) => item != null),
  },
  {
    input: "src/index.ts",
    output: [{ file: "dist/index.d.ts", format: "es" }],
    plugins: [dts()],
  },
];

export default config;
