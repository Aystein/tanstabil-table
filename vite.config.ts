import path from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(readFileSync(path.resolve(dirname, "package.json"), "utf8")) as {
  homepage?: string;
};

function getBasePath(homepage: string | undefined) {
  if (!homepage) {
    return "/";
  }

  const pathname = new URL(homepage).pathname;

  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

export default defineConfig({
  base: getBasePath(packageJson.homepage),
  fmt: {},
  plugins: [react()],
  lint: {
    options: { typeAware: true, typeCheck: true },
    plugins: ["react", "typescript"],
    rules: {
      "react/exhaustive-deps": [
        "error",
        {
          // A Regex pattern to match your custom hooks
          additionalHooks: "(useFrameEffect|useMyOtherHook)",
        },
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(dirname, "./src"),
    },
  },
});
