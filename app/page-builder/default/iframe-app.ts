// app/page-builder/default/iframe-app.ts
//
// Runs inside vue-wswg-editor's isolated iframe preview app. Where the Vuetify
// template installed the Vuetify plugin here, the Tailwind template instead
// just needs the compiled Tailwind stylesheet (and the icon font) present in
// the iframe document so blocks render with the same utilities as the site.

import "@mdi/font/css/materialdesignicons.css";
import "../../assets/css/main.css";
import type { App } from "vue";

export default (_ctx: { app: App }) => {
  // No Vue plugin to install — Tailwind is pure CSS, imported above.
};
