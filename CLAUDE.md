# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm install       # install deps (pnpm-lock.yaml is the source of truth)
pnpm dev           # start dev server on http://localhost:3000 (/ redirects to /editor)
pnpm build         # production build
pnpm generate      # static generation
pnpm preview       # preview a production build locally
pnpm export:site <site> [outDir]   # export one site as a standalone Nuxt project (same as the editor's Export button)
```

There is no test suite or lint script configured in `package.json`, so verification is manual: `pnpm build`, then try the editor and `/pb` pages in `pnpm dev`.

`.github/agents/nuxt-template.agent.md` is a condensed Copilot-agent version of this file. Keep the two in sync when conventions change.

## Big picture

This project **is a website builder**: a Nuxt 4 + Tailwind CSS app built around the `vue-wswg-editor` package. (It is the Tailwind port of the original Vuetify `template-website`; there is no Vuetify or SCSS anywhere.) It has only three routes:

- `/` redirects to `/editor` (`app/pages/index.vue`).
- `/editor?site=<site>&page=<page>` is the WYSIWYG editor (`app/pages/editor.vue`).
- `/pb/<site>/<page>` renders a saved page (`app/pages/pb/[site]/[page].vue`).

There is no Nuxt layout (`app/layouts/` doesn't exist, and `app/app.vue` is just `<NuxtPage />`). Every page's chrome (header, footer) comes from the blocks on it.

### Multi-site content layout

The builder hosts **several websites**, each a "site" (project) folder:

```
public/sites/<site>/
  menu.json          # shared header nav for that site
  pages/<page>.json  # one file per page: { blocks: [...], settings: {...} }
```

Everything is addressed by `(site, page)`. The editor toolbar has a 🌐 site switcher (with "+ New website") alongside the Pages menu.

Reads are plain static fetches of `/sites/<site>/pages/<page>.json`; writes go through the API. `server/utils/storage/` holds a swappable `PageStorage` adapter (`filesystem` by default, `http` for serverless). Pick it with `NUXT_PAGE_STORAGE`. The `http` driver requires `NUXT_PAGE_STORAGE_URL`, plus optional `NUXT_PAGE_STORAGE_COLLECTION` / `_MENU_COLLECTION` / `_TOKEN`; see `nuxt.config.ts` runtimeConfig. The adapter backs `server/api/{sites,pages,menu,save-page,create-site}`. The front-end reads bypass the adapter, so a non-filesystem driver needs those reads routed through the API too.

### The editor flow

- `editor.vue` mounts `WswgPageBuilder` with `theme="default"`. It fetches the page JSON; if that page doesn't exist yet, it seeds the new page with the `AppHeader` and `Footer` blocks (and settings) from that site's `index` page.
- Saving posts `{ site, page, data }` to `server/api/save-page.post.ts`, which sanitises both slugs (`sanitiseSlug` in `server/utils/storage/types.ts`), creates the site if needed, and saves through the storage adapter.
- `pb/[site]/[page].vue` renders a saved page via `PageRenderer`, 404ing if the site has no such page.
- `server/api/pages.get.ts` lists a site's pages and backs the toolbar's "Pages" menu.
- The editor intercepts image-field file picks and downscales/re-encodes them client-side (`app/utils/image-resize.ts`). The editor's image field silently rejects files over 10MB or outside jpeg/png/gif/webp, keeping the old image, which looks like the preview not updating. Images are stored inline as base64 in the page JSON.
- **Shared header menu:** the `AppHeader` block's nav is shared across every page of a site via `menu.json` (read by `server/api/menu.get.ts`). `save-page.post.ts` writes the saved page's `AppHeader` menus there. Both `editor.vue` (on load) and `pb/[site]/[page].vue` (on render) inject that menu into any `AppHeader` block, so editing the menu on one page updates it everywhere in that site. Each page still stores a `menus` copy on its `AppHeader` block, but it's vestigial: the shared menu overrides it (injection is skipped when the shared menu is empty).

### Exporting a site

A site becomes a **standalone Nuxt project**, either from the editor's **Export ⬇** button (downloads `<site>-site.zip` from `server/api/export.get.ts`, so a hosted builder needs no command line) or with `pnpm export:site <site> [outDir]` (`scripts/export-site.ts`, writes a folder). Both call `buildSiteExport()` in `scripts/export/core.ts` with a different `ExportSource`, so their output is identical. The output has:

- real `.vue` pages that use the components directly;
- base64 images extracted to `public/img/`, and the files of `/uploads/…` (and other site-relative media) the pages link to copied into `public/`;
- only the components actually used, resolved transitively (Nuxt auto-imports mean a component is often only referenced as a template tag);
- a shared `siteMenu` util;
- per-page layouts when page settings differ;
- `three` in `package.json` only when `PbScene3D` is used; no `vue-wswg-editor` dependency.

Keep `core.ts` free of `node:fs` and Nuxt APIs. The export endpoint reads pages through the `PageStorage` adapter and the component source from **Nitro server assets**: `nuxt.config.ts` bundles `app/{components,utils,composables,assets}` into the server (`assets:export-<dir>` storage) because a built server has no `app/` folder. In dev, Nitro runs in a worker, so check bytes with `ArrayBuffer.isView`, not `instanceof Uint8Array`.

`manifest.ts` maps each block type to its component and props, so keep it in sync when block wrappers change. The editor exports saved pages only; it offers to save first.

### Uploads (videos and 3D models)

Fields made with `uploadField()` (`app/utils/pb-fields.ts`, component `app/page-builder/fields/UploadField.vue`) show a URL box plus an **Upload** button. It posts to `server/api/upload.post.ts`, which accepts `.mp4`/`.webm` (`?kind=video`) or `.glb` (`?kind=model`), checks the extension, the file's magic bytes and `uploadMaxMb` (50), and stores it through `server/utils/media.ts`:

- `filesystem` driver: content-hashed files in `uploadDir` (`.data/uploads`), served by `server/routes/uploads/[name].get.ts` as `/uploads/<hash>.<ext>` with Range support (Safari needs it for video). Needs a disk that survives restarts.
- `http` driver: posted to Directus `/files` at `NUXT_PAGE_STORAGE_URL`; the URL saved is `<url>/assets/<id>`.

`NUXT_UPLOAD_STORAGE` picks the driver (blank follows `NUXT_PAGE_STORAGE`); `NUXT_UPLOAD_DIR` and `NUXT_UPLOAD_MAX_MB` override the others. Images don't use this: the editor keeps them inline as base64. Neither upload nor save has authentication, so put the builder behind a login when hosting it.

### Page-builder theme (`app/page-builder/default/`)

The `vue-wswg-editor` Vite plugin (registered in `nuxt.config.ts` with `rootDir: "@page-builder"`, aliased to `./app/page-builder`) scans for **theme folders**, each identified by a `theme.config.js`. `default/` is the only theme:

```
app/page-builder/default/
  theme.config.js        # theme metadata (title, version, tags…)
  layout/default.vue     # wraps rendered blocks; page settings applied inline
  iframe-app.ts          # leftover; not loaded by the editor (see below)
  blocks/<name>/
    <Name>.vue           # the block as seen by the editor/renderer
    fields.ts            # editable field definitions (createField.text/select/color/image/object/repeater/textarea)
```

A block's `<Name>.vue` is a thin wrapper that maps the fields declared in `fields.ts` onto props of a plain display component in `app/components/` (e.g. `default/blocks/hero/Hero.vue` wraps `~/components/Hero.vue`). When adding or editing a block, keep `fields.ts`, the wrapper's props and `scripts/export/manifest.ts` in sync. The block folder is snake_case; the **block `type`** (used in the page JSON) is the PascalCase `<Name>` of the `.vue` file inside it (e.g. `logo_cloud/LogoCloud.vue` → type `"LogoCloud"`). Select fields store `"true"`/`"false"` as strings; use `truthy()` from `~/utils/pb`.

**The modern block kit.** The template sites are built from: `AppHeader`, `Hero`, `Banner` (page header), `LogoCloud`, `Features`, `Content` (text + image), `Stats`, `Testimonials`, `Pricing`, `Faq`, `Team`, `CTA`, `ContactForm`, `BlogPreview`, `Gallery`, `Footer`. Conventions:
- Wrappers use an **untyped** `defineProps([...])` and `v-bind="props"` onto the display component. Typed boolean props would turn a missing value into `false` and override the display component's default.
- `style` is a reserved Vue prop name and never reaches the component, so a block's look option is called `variant` (Header, Stats, CTA).
- Display components are built from shared pieces: `PbSection` (tone `light`/`muted`/`dark`/`brand`, `space`, `width`, `anchor` id), `PbHeading` (eyebrow/title/subtitle), `PbButton` (primary/secondary/link), `PbMedia` (image or accent placeholder) and `PbMockup` (an HTML dashboard picture for Hero and Text + image; its stat cards come from the blocks' `mockupStats` field on the Mockup tab, falling back to `MOCKUP_STATS` in `app/utils/pb.ts`).
- **Wrap every block's `fields.ts` export in `blockFields({...})`** (from `app/utils/pb-fields.ts`). Once any field of a block has a `group`, `vue-wswg-editor` shows only grouped fields as tabs and silently hides ungrouped ones; `blockFields` puts ungrouped fields on a first "Content" tab. Every visible piece of text should be a field (labels, link text, messages), so static sites need no code edits.
- **Hero visuals** (Visual tab): app mockup, image, video, 3D shape, 3D model, none; plus an image/video/mockup "3D tilt on hover" (`PbTilt`) and a video backdrop. `PbScene3D` draws the 3D shape (knot/gem/rings/sphere, tinted with `--pb-accent`) or a `.glb` model with three.js, dynamically imported so only pages with a 3D visual load it; it pauses offscreen, honours reduced motion and falls back to a `PbMedia` placeholder if WebGL or the model fails. Video and model fields are upload fields (see Uploads below) that store a URL; a pasted URL works too. The exporter adds `three` to an exported site's dependencies when `PbScene3D` is used.
- Shared field builders live in `app/utils/pb-fields.ts` (`toneField`, `spaceField`, `alignField`, `headingFields`, `buttonFields`, `apiSourceFields`); block `fields.ts` files import it relatively (`../../../../utils/pb-fields`).
- Content conventions (helpers in `app/utils/pb.ts`): `*asterisks*` in a title highlight words (`markedSegments`); textarea lines like `Label | /path` become links (`linkLines`); links go through `pbHref`, which rewrites site-relative paths to `/pb/<site>/<page>` while previewing, so they work both in the builder and in an exported site. Blocks use plain `<a>` tags.

Everything in `app/components/` is reachable from a block (directly or through shared pieces). Delete a component once no block uses it.

**Template sites.** `public/sites/` holds three starter sites to compare, generated from the same blocks with different page settings. `editor.vue`'s `DEFAULT_SITE` is `saas`.
- `saas` ("Lumen"): indigo, Inter, soft corners. Pages: `index`, `pricing`, `contact`.
- `agency` ("Northbound"): lime on dark, Space Grotesk, sharp corners. Pages: `index`, `about`, `contact`.
- `business` ("Evergreen Partners"): teal, Fraunces headings, round corners. Pages: `index`, `about`, `contact`.

Their photos are hotlinked from Unsplash (`images.unsplash.com`), not stored in the repo.

**Internal-link gotcha (important for any display component that renders in the editor):** use `RouterLink` (imported from `vue-router`), **not** `NuxtLink`, for internal links. The editor's iframe preview is a bare Vue app with no Nuxt instance, so `NuxtLink`'s setup calls `useNuxtApp()` and throws `E1001`, which crashes the whole editor canvas (blank preview). `RouterLink` works in both the iframe and the published page. When choosing a link element dynamically, bind the imported component (`:is="path ? RouterLink : 'div'"`), not the string `'NuxtLink'`.

**Page settings** (the panel behind the ⚙ toolbar button, distinct from per-block settings) come from the *layout* component, not a separate config:
- Each layout declares a `fields` object in a normal `<script>` block. It uses the same `createField.*` API as blocks, and `group` becomes a settings tab. `defineOptions` is avoided there because the fields reference the runtime `createField` import.
- The settings are stored on `pageData.settings` and spread onto the layout as props by both renderers. `layout/default.vue` has a **Theme** group (`accentColor`, `font` = modern/friendly/tech/editorial, `corners` = sharp/soft/round) and a **Layout** group (`containerWidth`, `maxWidth`, `pagePadding`, `footerSpacing`).
- `pageLayoutStyle()` in `app/utils/pb.ts` turns them into the layout's inline style: container width/padding plus the `--pb-*` theme variables (`--pb-accent`, `--pb-accent-ink`, `--pb-accent-strong`/`-soft`, `--pb-font-display`/`-body`, `--pb-radius`/`-btn`). The exporter calls the same function, so exported sites match.
- For this to work end to end, `editor.vue` seeds the field defaults into `pageData.settings` via `getLayouts()` after registry init (otherwise the dropdowns render blank).
- `pb/[site]/[page].vue` also passes `:with-layout="true"` to `PageRenderer`, which defaults `withLayout` to `false`. That way the layout wrapper, and so the settings, apply on the published page the same way they do in the editor canvas.

### Styling & Tailwind inside the iframe preview

Global styling lives in `app/assets/css/main.css`:
- It loads the Google Fonts used by the Font setting, then `@import "tailwindcss"` (Tailwind v4 via the `@tailwindcss/vite` plugin in `nuxt.config.ts`).
- `@theme inline` maps the `--pb-*` variables to utilities: `bg-brand`, `text-brand-ink` (readable text on the accent), `text-brand-text` (accent for text/icons), `text-ink`, `bg-night`, `font-display`, `font-body`, `rounded-card`, `rounded-btn`. Use these, not hard-coded colours, in kit components so Page settings can re-theme a site.
- `text-brand-text` reads `--pb-brand-text`, which `PbSection` sets per tone: the "strong" shade on light sections (darkened when the accent is light, like lime) and the "soft" shade on dark ones (lightened when the accent is dark). Anything placed on a dark card inside a light section must set it itself (see `CTA.vue`).
- `@theme` adds the kit text sizes `text-fine`, `text-small`, `text-lead`, `text-big` and an `error` colour; the components use those alongside Tailwind's own sizes.

Icons come from the `@mdi/font` webfont (`<i class="mdi mdi-…">`, or just the icon name in a block's icon field). The `margin-top-sm`/`.block-wrapper` selectors at the end of `main.css` target classes `vue-wswg-editor` adds at runtime, so keep them.

`vue-wswg-editor` renders the live block preview inside an isolated iframe with its own Vue app:

- The editor copies the parent page's stylesheets into the iframe, which is how blocks get Tailwind and the mdi font there. `app/page-builder/default/iframe-app.ts` is a leftover: `vue-wswg-editor`'s Vite plugin never loads it, so code put there does not run.
- **Links in the canvas:** `pbHref` reads the site from the editor's `?site=` (via `window.parent`) as well as from `/pb/<site>/…`, so links point at the current site. `editor.vue` attaches a capture-phase click handler to the iframe document: `#anchors` on the current page scroll, links to another page of the site open that page in the editor (with a confirm if there are unsaved changes), external links open in a new tab. Without it a click would load the URL inside the canvas; an unknown path like `/contact` falls back to `/` → `/editor` → the default site.
- `app/plugins/vue-wswg-editor.client.ts` checks `isWswgIframePreview()` and stubs out Nuxt's own app mount inside that iframe, so Nuxt doesn't fight the editor's isolated app for `#app`.
- `server/middleware/wswg-iframe-fix.ts` redirects `/@id/...` requests to `/_nuxt/@id/...`. The editor's generated iframe HTML assumes Vite is mounted at the root, but Nuxt mounts its dev server under `/_nuxt/`.

### Backend data in blocks

List-style blocks (`AppHeader`, `Features`, `Stats`, `Testimonials`, `BlogPreview`, `Gallery`) can either show static content saved in the page or pull rows live from a backend. Setting the block's `apiCollection` (plus `apiLimit`, `apiSort` and the `apiFields` mapping) switches to live rows.

`app/composables/useCollection.ts` handles that switch and maps rows with field aliases. `app/utils/api.ts` resolves the backend URL lazily on the first request: first `NUXT_PUBLIC_API_BASE` (`runtimeConfig.public.apiBase`), then `BACKEND_ADDR` in `public/env.json`, then `http://localhost:8055`. A collection name becomes `${base}/items/<collection>` (Directus-style); a `/path` or a full URL is used as given.
