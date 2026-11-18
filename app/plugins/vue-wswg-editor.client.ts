import "vue-wswg-editor/style.css";
import { isWswgIframePreview } from "vue-wswg-editor";

export default defineNuxtPlugin((nuxtApp) => {
  // Prevent Nuxt from mounting its app inside the wswg iframe preview context.
  // The iframe loads its own isolated app via createIframeApp(); if Nuxt also
  // mounts it would overwrite #app and break the preview.
  // Tailwind styling is loaded into the iframe via the theme's iframe-app.ts,
  // which imports the compiled Tailwind stylesheet.
  if (isWswgIframePreview()) {
    nuxtApp.hook("app:created", (vueApp) => {
      vueApp.mount = (() => vueApp) as any;
    });
  }
});