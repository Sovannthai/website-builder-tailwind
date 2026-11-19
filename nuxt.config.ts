import tailwindcss from "@tailwindcss/vite";
import { vueWswgEditorPlugin } from "vue-wswg-editor/vite-plugin";
import { fileURLToPath, URL } from "node:url";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  ssr: false,
  experimental: {
    // Nuxt 4 makes built chunks import the app entry as "#entry" through an
    // import map in the page HTML. The editor canvas (__wswg-iframe-preview.html)
    // has its own import map without it, so block chunks failed to load there
    // and the hosted editor showed an empty canvas. Use plain relative imports.
    entryImportMap: false,
  },
  runtimeConfig: {
    // Where the page builder persists pages/menu. "filesystem" (default) writes
    // JSON into public/ and needs a writable disk; "http" posts to a REST
    // backend and is what serverless deploys should use.
    // Override with NUXT_PAGE_STORAGE / NUXT_PAGE_STORAGE_URL.
    pageStorage: process.env.NUXT_PAGE_STORAGE || "filesystem",
    pageStorageUrl: process.env.NUXT_PAGE_STORAGE_URL || "",
    pageStorageCollection: process.env.NUXT_PAGE_STORAGE_COLLECTION || "pages",
    pageStorageMenuCollection: process.env.NUXT_PAGE_STORAGE_MENU_COLLECTION || "site_menu",
    pageStorageToken: process.env.NUXT_PAGE_STORAGE_TOKEN || "",
    // Uploaded videos and 3D models (the Upload button on those fields).
    // "filesystem" saves into uploadDir and serves them at /uploads/<file>;
    // "http" posts them to the Directus files API at pageStorageUrl.
    // Blank follows pageStorage. Override with NUXT_UPLOAD_STORAGE,
    // NUXT_UPLOAD_DIR and NUXT_UPLOAD_MAX_MB.
    uploadStorage: "",
    uploadDir: ".data/uploads",
    uploadMaxMb: 50,
    public: {
      // Optional backend override (NUXT_PUBLIC_API_BASE); public/env.json is the default.
      apiBase: "",
    },
  },
  modules: [
    (_options, nuxt) => {
      nuxt.hooks.hook("vite:extendConfig", (config) => {
        // @ts-expect-error
        config.plugins.push(vueWswgEditorPlugin({ rootDir: "@page-builder" }));
      });
    },
    // vue-wswg-editor's Vite plugin emits the editor canvas page
    // (__wswg-iframe-preview.html) at the root of the client build, but Nuxt
    // only publishes the _nuxt/ folder of it. Without this copy the hosted
    // editor's iframe 404s (falls back to the SPA) and shows no blocks.
    //
    // The built chunks also expect window.__NUXT__.config (Nuxt writes it into
    // its own index.html) to find /_nuxt/ assets, so add it to this page too.
    (_options, nuxt) => {
      nuxt.hook("nitro:build:public-assets", async (nitro) => {
        const name = "__wswg-iframe-preview.html";
        const from = join(nuxt.options.buildDir, "dist", "client", name);
        if (!existsSync(from)) {
          console.warn(`[vue-wswg-editor] ${name} not found in the client build; the editor canvas will be blank.`);
          return;
        }
        const { baseURL, buildAssetsDir, cdnURL } = nuxt.options.app;
        const config = {
          public: nuxt.options.runtimeConfig.public,
          app: { baseURL, buildAssetsDir, cdnURL },
        };
        const script = `<script>window.__NUXT__=window.__NUXT__||{};window.__NUXT__.config=${JSON.stringify(config)};</script>`;
        const html = (await readFile(from, "utf-8")).replace("<head>", `<head>\n   ${script}`);
        await writeFile(join(nitro.options.output.publicDir, name), html, "utf-8");
      });
    },
    "@vueuse/nuxt",
  ],
  vite: {
    resolve: {
      alias: {
        "@page-builder": fileURLToPath(new URL("./app/page-builder", import.meta.url)),
      },
    },
    optimizeDeps: {
      exclude: [
        "vue-wswg-editor",
        "vue-wswg-editor:layouts",
        "vue-wswg-editor:blocks",
        "vue-wswg-editor:fields",
        "vue-wswg-editor:thumbnails",
        "vue-wswg-editor:themes",
        "virtual:wswg-iframe-app",
      ],
    },
    plugins: [
      // Tailwind CSS v4 — replaces the Vuetify Vite plugin. This makes Tailwind
      // utilities available across the app and (via the shared Vite pipeline)
      // inside the page-builder iframe preview.
      tailwindcss(),
    ],
    build: {
      minify: "terser",
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
  },
  nitro: {
    // The editor's Export button (server/api/export.get.ts) copies the block
    // components' source into the exported project. A built/hosted server has
    // no app/ folder, so bundle those source files into the server.
    serverAssets: ["components", "utils", "composables", "assets"].map((dir) => ({
      baseName: `export-${dir}`,
      dir: fileURLToPath(new URL(`./app/${dir}`, import.meta.url)),
    })),
  },
  css: ["@mdi/font/css/materialdesignicons.css", "~/assets/css/main.css"],
  app: {
    head: {
      title: "Website Builder",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
    },
  },
});
