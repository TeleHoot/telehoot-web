import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import process from "process";
import tailwindcss from "@tailwindcss/vite";

import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return defineConfig({
    build: {
      outDir: "dist",
    },
    define: {
      __API__: JSON.stringify(env.VITE_API),
      __IS_DEV__: JSON.stringify(env.VITE_IS_DEV),
      __BOT_NAME: JSON.stringify(env.VITE_BOT_NAME),
    },
    server: {
      allowedHosts: [
        "front.frp.deti-durova.ru",
        "front-stalinidze.frp.deti-durova.ru",
        "deti-durova.online",
        "telehoot.deti-durova.online"
      ],
    },
    plugins: [
      react(),
      tailwindcss(),
      tsconfigPaths(),
    ],
    resolve: {
      extensions: [".tsx", ".ts", ".jsx", ".js"],
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  });
};
