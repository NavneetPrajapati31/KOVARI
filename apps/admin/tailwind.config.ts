import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "../../src/shared/**/*.{ts,tsx}",
    "../../components/**/*.{ts,tsx}",
  ],
};

export default config;
