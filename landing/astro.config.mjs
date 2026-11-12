// @ts-check
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: "https://schoolos.jarox.dev",
  trailingSlash: "always",
  vite: {
    plugins: [tailwindcss()],
  },
});
