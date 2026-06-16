import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
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
