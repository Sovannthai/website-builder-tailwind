/**
 * The site exporter, independent of where its inputs live and where its output
 * goes. It turns one website into the files of a standalone Nuxt project and
 * returns them in memory:
 *
 *   - scripts/export-site.ts (pnpm export:site) reads the disk and writes a folder;
 *   - server/api/export.get.ts reads the page storage + bundled source and
 *     sends a .zip, so a hosted builder can export without a command line.
 *
 * Keep this file free of node:fs and Nuxt/Nitro APIs: everything it reads
 * comes through the ExportSource it is given.
 */
import { BLOCK_MANIFEST } from "./manifest";
import { pageLayoutStyle } from "../../app/utils/pb";

export interface ExportSource {
  /** A builder source file under app/, e.g. "components/Hero.vue". Null if missing. */
  readSource(path: string): Promise<Uint8Array | null>;
  /** Every file under app/<dir>/, as paths relative to app/ (e.g. "assets/css/main.css"). */
  listSource(dir: string): Promise<string[]>;
  /** A file the site links to by URL path ("/uploads/x.mp4", "/env.json"). Null if missing. */
  readPublic(urlPath: string): Promise<Uint8Array | null>;
  /** The site's page slugs. */
  listPages(): Promise<string[]>;
  getPage(slug: string): Promise<{ blocks?: any[]; settings?: Record<string, any> } | null>;
  /** The site's shared header menu. */
  getMenu(): Promise<any[]>;
}

export interface ExportResult {
  /** Project files: path relative to the project root -> contents. */
  files: Map<string, Uint8Array | string>;
  pages: string[];
  warnings: string[];
  /** Progress lines (the CLI prints them). */
  log: string[];
}

// ------------------------------------------------------------------ helpers

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const toText = (bytes: Uint8Array | null) => (bytes ? decoder.decode(bytes) : null);

/** Short content hash for file names (FNV-1a, 2 x 32 bit). No node:crypto needed. */
function contentHash(bytes: Uint8Array): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193 ^ bytes.length;
  for (let i = 0; i < bytes.length; i++) {
    h1 = Math.imul(h1 ^ bytes[i]!, 0x01000193);
    h2 = Math.imul(h2 ^ bytes[i]!, 0x5bd1e995);
  }
  return (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0");
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

const DATA_URI = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i;
const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

/** Site-relative media a page links to; copied into the export's public/. */
const LOCAL_MEDIA = /^\/(img|video|models|uploads)\/[A-Za-z0-9._\/-]+$/;

/**
 * Walk the page data: turn inline base64 images into public/img/ files and
 * collect site-relative media paths so their files can be copied too.
 */
function extractMedia(
  value: any,
  files: Map<string, Uint8Array | string>,
  seen: Map<string, string>,
  media: Set<string>
): any {
  if (typeof value === "string") {
    if (LOCAL_MEDIA.test(value)) media.add(value);
    const match = value.match(DATA_URI);
    if (!match) return value;
    const bytes = base64ToBytes(match[2]!);
    const hash = contentHash(bytes);
    const cached = seen.get(hash);
    if (cached) return cached;
    const url = `/img/${hash}.${EXT[match[1]!.toLowerCase()] ?? "bin"}`;
    files.set(`public${url}`, bytes);
    seen.set(hash, url);
    return url;
  }
  if (Array.isArray(value)) return value.map((item) => extractMedia(item, files, seen, media));
  if (value && typeof value === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) out[k] = extractMedia(v, files, seen, media);
    return out;
  }
  return value;
}

// ------------------------------------------------- component dependency graph

/**
 * Components a component uses. Nuxt auto-imports, so usage is often only
 * visible as a tag in the template (`<PbSection>`) with no import.
 */
function componentDeps(src: string) {
  const components = new Set<string>();
  const utils = new Set<string>();
  const composables = new Set<string>();

  for (const m of src.matchAll(/<([A-Z][A-Za-z0-9]*)[\s/>]/g)) components.add(m[1]!);
  for (const m of src.matchAll(/<([a-z]+(?:-[a-z]+)+)[\s/>]/g)) {
    components.add(m[1]!.split("-").map((p) => p[0]!.toUpperCase() + p.slice(1)).join(""));
  }
  for (const m of src.matchAll(/from ['"][~@]\/components\/([A-Za-z0-9]+)\.vue['"]/g)) components.add(m[1]!);
  for (const m of src.matchAll(/from ['"][~@]\/utils\/([A-Za-z0-9-]+)['"]/g)) utils.add(m[1]!);
  for (const m of src.matchAll(/from ['"][~@]\/composables\/([A-Za-z0-9-]+)['"]/g)) composables.add(m[1]!);
  return { components, utils, composables };
}

async function resolveAllDeps(entry: string[], source: ExportSource) {
  const components = new Map<string, string>(); // name -> source
  const utils = new Set<string>();
  const composables = new Set<string>();
  const queue = [...entry];

  while (queue.length) {
    const name = queue.pop()!;
    if (components.has(name)) continue;
    const src = toText(await source.readSource(`components/${name}.vue`));
    if (src === null) continue; // a built-in tag like <NuxtLink>, or not a component
    components.set(name, src);
    const deps = componentDeps(src);
    deps.components.forEach((c) => !components.has(c) && queue.push(c));
    deps.utils.forEach((u) => utils.add(u));
    deps.composables.forEach((c) => composables.add(c));
  }
  return { components, utils, composables };
}

// ------------------------------------------------------------ code emission

const lcFirst = (s: string) => s[0]!.toLowerCase() + s.slice(1);
const ucFirst = (s: string) => s[0]!.toUpperCase() + s.slice(1);
const attrEscape = (s: string) => s.replace(/"/g, "&quot;");

interface EmitBlock {
  type: string;
  props: Record<string, any>;
}

/**
 * Emit a page's <template> plus the consts its props need. Header menus that
 * match the shared `siteMenu` reference it instead of inlining a copy.
 */
function emitPage(blocks: EmitBlock[], opts: { layout?: string; siteMenu?: any[] } = {}) {
  const consts: string[] = [];
  const tags: string[] = [];
  const menuJson = opts.siteMenu ? JSON.stringify(opts.siteMenu) : null;

  blocks.forEach((block, i) => {
    const tag = BLOCK_MANIFEST[block.type]!.component;
    const attrs: string[] = [];

    for (const [key, value] of Object.entries(block.props)) {
      if (value === undefined || value === null) continue;
      if (key === "menus" && menuJson && JSON.stringify(value) === menuJson) {
        attrs.push(`:menus="siteMenu"`);
        continue;
      }
      if (typeof value === "string" && !value.includes("\n") && value.length <= 80) {
        attrs.push(`${key}="${attrEscape(value)}"`);
      } else if (typeof value === "number" || typeof value === "boolean") {
        attrs.push(`:${key}="${value}"`);
      } else {
        // Long/multiline strings and objects/arrays are hoisted to a const so
        // their quotes and newlines can't break the attribute markup.
        const name = `${lcFirst(tag)}${i}${ucFirst(key)}`;
        consts.push(`const ${name} = ${JSON.stringify(value, null, 2)}`);
        attrs.push(`:${key}="${name}"`);
      }
    }

    tags.push(attrs.length ? `  <${tag}\n${attrs.map((a) => `    ${a}`).join("\n")}\n  />` : `  <${tag} />`);
  });

  const scriptLines: string[] = [];
  if (opts.layout && opts.layout !== "default") {
    scriptLines.push(`definePageMeta({ layout: ${JSON.stringify(opts.layout)} })`);
  }
  scriptLines.push(...consts);

  const script = scriptLines.length ? `\n<script setup>\n${scriptLines.join("\n\n")}\n</script>\n` : "";
  return `<template>\n${tags.join("\n")}\n</template>\n${script}`;
}

function emitLayout(settings: Record<string, any>) {
  // Same width/padding/theme variables the builder's layout applies, written
  // out as static CSS (see pageLayoutStyle in app/utils/pb.ts).
  const toCss = (key: string) => (key.startsWith("--") ? key : key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`));
  const declarations = Object.entries(pageLayoutStyle(settings))
    .map(([key, value]) => `  ${toCss(key)}: ${value};`)
    .join("\n");

  return `<template>
  <div class="site-layout">
    <slot />
  </div>
</template>

<style scoped>
.site-layout {
  width: 100%;
  margin: 0 auto;
  background: #fff;
  color: var(--pb-ink, #0f172a);
  font-family: var(--pb-font-body, "Inter", sans-serif);
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
${declarations}
}
</style>
`;
}

function emitNuxtConfig() {
  return `import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  ssr: false,
  runtimeConfig: {
    public: {
      // Backend for blocks that load live data. Normally configured in
      // public/env.json (read at runtime, so no rebuild needed); this is only
      // an optional deploy-time override.
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "",
    },
  },
  vite: {
    // Tailwind CSS v4 — makes the utilities used by the exported components
    // available at build time.
    plugins: [tailwindcss()],
  },
  css: ["@mdi/font/css/materialdesignicons.css", "~/assets/css/main.css"],
});
`;
}

function emitPackageJson(name: string, needsThree: boolean) {
  const deps: Record<string, string> = {
    "@mdi/font": "^7.4.47",
    "@tailwindcss/vite": "^4.1.0",
    nuxt: "^4.2.2",
    tailwindcss: "^4.1.0",
    vue: "^3.5.26",
    "vue-router": "^4.6.4",
  };
  // PbScene3D (Hero "3D shape"/"3D model" visual) loads three.js on demand.
  if (needsThree) deps.three = "^0.187.0";

  return `${JSON.stringify(
    {
      name,
      private: true,
      type: "module",
      scripts: {
        build: "nuxt build",
        dev: "nuxt dev",
        generate: "nuxt generate",
        preview: "nuxt preview",
        postinstall: "nuxt prepare",
      },
      dependencies: Object.fromEntries(Object.entries(deps).sort()),
    },
    null,
    2
  )}\n`;
}

/** Page slug -> file path under app/pages/ ("index" is the site root). */
const pageFilePath = (slug: string) => `app/pages/${slug === "index" ? "index" : slug}.vue`;
const pageRoute = (slug: string) => (slug === "index" ? "/" : `/${slug}`);

// ---------------------------------------------------------------------- main

export async function buildSiteExport(
  site: string,
  source: ExportSource,
  options: { only?: string[] } = {}
): Promise<ExportResult> {
  const files = new Map<string, Uint8Array | string>();
  const warnings: string[] = [];
  const log: string[] = [];

  // 1. every saved page in this site
  let slugs = [...(await source.listPages())].sort();
  if (options.only?.length) slugs = slugs.filter((s) => options.only!.includes(s));
  if (!slugs.length) throw new Error(`No pages found in website "${site}".`);
  log.push(`pages: ${slugs.join(", ")}`);

  // 2. shared menu (single source of truth across this site's pages)
  let siteMenu: any[] = [];
  try {
    const menu = await source.getMenu();
    if (Array.isArray(menu)) siteMenu = menu;
  } catch {
    /* no menu */
  }

  // 3. each page: map blocks to components, pull media out
  const seenImages = new Map<string, string>();
  const media = new Set<string>();
  const pages: Array<{ slug: string; blocks: EmitBlock[]; settings: Record<string, any> }> = [];
  const unmapped = new Set<string>();

  for (const slug of slugs) {
    const schema = await source.getPage(slug);
    if (!schema) continue;
    const rawBlocks: any[] = schema.blocks ?? [];
    rawBlocks.forEach((b) => !BLOCK_MANIFEST[b?.type] && unmapped.add(b?.type));

    const cleaned = extractMedia(rawBlocks, files, seenImages, media);
    const blocks: EmitBlock[] = cleaned
      .filter((b: any) => BLOCK_MANIFEST[b?.type])
      .map((b: any) => ({ type: b.type, props: BLOCK_MANIFEST[b.type]!.props(b) }));
    pages.push({ slug, blocks, settings: schema.settings ?? {} });
  }
  if (unmapped.size) warnings.push(`skipped unknown block types: ${[...unmapped].join(", ")}`);
  log.push(`extracted ${seenImages.size} image(s) to public/img/`);

  // 4. layouts: one per distinct page-settings combination
  const layoutByKey = new Map<string, string>();
  const layoutSettings = new Map<string, Record<string, any>>();
  const layoutForPage = new Map<string, string>();
  const ordered = [...pages].sort((a, b) => (a.slug === "index" ? -1 : b.slug === "index" ? 1 : 0));
  for (const page of ordered) {
    const key = JSON.stringify(pageLayoutStyle(page.settings));
    if (!layoutByKey.has(key)) {
      const name = layoutByKey.size === 0 ? "default" : `page-${page.slug}`;
      layoutByKey.set(key, name);
      layoutSettings.set(name, page.settings);
    }
    layoutForPage.set(page.slug, layoutByKey.get(key)!);
  }
  for (const [name, settings] of layoutSettings) files.set(`app/layouts/${name}.vue`, emitLayout(settings));
  log.push(`${layoutSettings.size} layout(s): ${[...layoutSettings.keys()].join(", ")}`);

  // 5. components used across all pages (plus everything they use)
  const entry = [...new Set(pages.flatMap((p) => p.blocks).map((b) => BLOCK_MANIFEST[b.type]!.component))];
  const { components, utils, composables } = await resolveAllDeps(entry, source);
  for (const [name, src] of components) files.set(`app/components/${name}.vue`, src);

  for (const name of composables) {
    const src = toText(await source.readSource(`composables/${name}.ts`));
    if (src === null) continue;
    files.set(`app/composables/${name}.ts`, src);
    // composables pull in utils of their own (e.g. api) — follow those too
    for (const m of src.matchAll(/from ['"][~@]\/utils\/([A-Za-z0-9-]+)['"]/g)) utils.add(m[1]!);
  }
  for (const util of utils) {
    const src = await source.readSource(`utils/${util}.ts`);
    if (src) files.set(`app/utils/${util}.ts`, src);
  }
  log.push(`copied ${components.size} component(s), ${utils.size} util(s), ${composables.size} composable(s)`);

  // 6. shared assets (app/assets/css/main.css is the Tailwind entry) and the
  //    media files the pages link to
  for (const path of await source.listSource("assets")) {
    const bytes = await source.readSource(path);
    if (bytes) files.set(`app/${path}`, bytes);
  }
  let copiedMedia = 0;
  for (const urlPath of media) {
    const bytes = await source.readPublic(urlPath);
    if (bytes) {
      files.set(`public${urlPath}`, bytes);
      copiedMedia++;
    } else {
      warnings.push(`linked file not found, not included: ${urlPath}`);
    }
  }
  if (copiedMedia) log.push(`copied ${copiedMedia} media file(s)`);

  // 7. generated source
  if (siteMenu.length) {
    files.set(
      "app/utils/site-menu.ts",
      `// Shared navigation, used by every page's header.\n` +
        `// Auto-imported by Nuxt, so pages can use \`siteMenu\` directly.\n` +
        `export const siteMenu = ${JSON.stringify(siteMenu, null, 2)}\n`
    );
  }
  for (const page of pages) {
    files.set(
      pageFilePath(page.slug),
      emitPage(page.blocks, { layout: layoutForPage.get(page.slug), siteMenu: siteMenu.length ? siteMenu : undefined })
    );
  }

  files.set("app/app.vue", `<template>\n  <NuxtLayout>\n    <NuxtPage />\n  </NuxtLayout>\n</template>\n`);
  files.set("nuxt.config.ts", emitNuxtConfig());
  files.set("package.json", emitPackageJson(site, components.has("PbScene3D")));
  files.set("tsconfig.json", `{\n  "extends": "./.nuxt/tsconfig.json"\n}\n`);
  files.set(".gitignore", ["node_modules", ".nuxt", ".output", "dist", ".DS_Store"].join("\n") + "\n");

  // Carry the builder's env.json across so the exported site talks to the
  // same backend. It's read at runtime, so it can be changed after deploy.
  let envJson: Record<string, any> = { BACKEND_ADDR: "http://localhost:8055" };
  try {
    const raw = toText(await source.readPublic("/env.json"));
    if (raw) envJson = JSON.parse(raw);
  } catch {
    /* ship the localhost default */
  }
  files.set("public/env.json", `${JSON.stringify(envJson, null, 2)}\n`);

  const dynamicBlocks = pages
    .flatMap((p) => p.blocks)
    .filter((b) => b.props.apiCollection)
    .map((b) => `${BLOCK_MANIFEST[b.type]!.component} → \`${b.props.apiCollection}\``);
  const routeList = pages.map((p) => `- \`${pageRoute(p.slug)}\` → \`${pageFilePath(p.slug)}\``);
  const apiSection = dynamicBlocks.length
    ? `\n## Live data\n\nThese blocks load from the backend at runtime:\n\n` +
      dynamicBlocks.map((d) => `- ${d}`).join("\n") +
      `\n\nThe backend URL lives in \`public/env.json\`:\n\n` +
      `\`\`\`json\n{ "BACKEND_ADDR": "${envJson.BACKEND_ADDR ?? ""}" }\n\`\`\`\n\n` +
      `It's read at runtime, so \`pnpm install && pnpm dev\` works as-is, and a\n` +
      `deployed site can be pointed at another backend by editing that one file\n` +
      `— no rebuild. \`NUXT_PUBLIC_API_BASE\` overrides it if you prefer env vars.\n\n` +
      `Each block accepts a collection key (\`news\`), a path (\`/api/news\`) or a\n` +
      `full URL, and its \`apiFields\` prop maps API field names onto what the\n` +
      `component renders.\n`
    : "";
  files.set(
    "README.md",
    `# Exported site\n\nA plain Nuxt project exported from the page builder.\n\n` +
      `\`\`\`bash\npnpm install\npnpm dev\n\`\`\`\n\n## Pages\n\n${routeList.join("\n")}\n\n` +
      `Everything here is ordinary source — edit the pages and components directly.\n` +
      `There is no builder runtime and no vue-wswg-editor dependency.\n` +
      apiSection
  );

  // 8. menu links that have no matching page
  const routes = new Set(pages.map((p) => pageRoute(p.slug)));
  const dangling = siteMenu
    .flatMap((m: any) => [m, ...(m.children ?? [])])
    .map((m: any) => String(m?.path ?? "").split("#")[0]) // "/#work" is the home page
    .filter((path: string) => path && path.startsWith("/") && !routes.has(path));
  if (dangling.length) {
    warnings.push(`menu links with no matching page (they will 404): ${[...new Set(dangling)].join(", ")}`);
  }
  log.push(`generated ${pages.length} page(s): ${[...routes].join(", ")}`);

  return { files, pages: pages.map((p) => p.slug), warnings, log };
}

/** Bytes for a file the result holds (strings are UTF-8 encoded). */
export const fileBytes = (contents: Uint8Array | string) =>
  typeof contents === "string" ? encoder.encode(contents) : contents;
