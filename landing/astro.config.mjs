// @ts-check
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: "https://schoolos.jarox.dev",
  trailingSlash: "always",
  vite: {
    // Without this, Vite also picks up the app's ../tsconfig.json, which extends
    // expo/tsconfig.base and breaks builds where only landing/ is installed (Cloudflare).
    tsconfig: "./tsconfig.json",
    plugins: [tailwindcss()],
  },
});
