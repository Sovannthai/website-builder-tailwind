# Website Builder (Tailwind)

A drag-and-drop **website builder** built with Nuxt 4, Tailwind CSS v4 and [`vue-wswg-editor`](https://www.npmjs.com/package/vue-wswg-editor).
You build pages from ready-made blocks in a WYSIWYG editor, preview them, and export any site as a **standalone Nuxt project** you can deploy anywhere.

This is the Tailwind port of the original Vuetify `template-website`. It contains no Vuetify or SCSS.

## Features

- **Visual editor** at `/editor`: add, reorder and edit blocks, with a live preview in an isolated iframe.
- **Several websites in one builder**: switch with the 🌐 site switcher or create a new site with "+ New website".
- **16 blocks**: header, hero, page banner, logo cloud, features, text + image, stats, testimonials, pricing, FAQ, team, CTA, contact form, blog preview, gallery and footer.
- **Theming per page** (⚙ Page settings): accent colour, font pairing, corner style, container width and padding.
- **Shared header menu**: edit the nav on one page and it updates on every page of that site.
- **Rich hero visuals**: app mockup, image, video, 3D shape or uploaded `.glb` model (three.js), with optional 3D tilt and video backdrop.
- **Uploads** for videos (`.mp4`, `.webm`) and 3D models (`.glb`). Images are resized in the browser and stored inline.
- **Live data**: list blocks can pull rows from a Directus-style backend instead of static content.
- **Export**: download a site as a clean Nuxt project with real `.vue` pages, extracted images and only the components it uses.

## Tech stack

| | |
|---|---|
| Framework | Nuxt 4 (SPA mode, `ssr: false`), Vue 3.5 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`), `@mdi/font` icons |
| Editor | `vue-wswg-editor` |
| 3D | `three` (loaded only on pages that use a 3D visual) |
| Export zip | `fflate` |
| Package manager | **pnpm** (`pnpm-lock.yaml` is the source of truth) |

## Getting started

Requirements: Node.js 20+ and pnpm.

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>. It redirects to the editor and loads the default `saas` site.

## Routes

| Route | What it does |
|---|---|
| `/` | Redirects to `/editor` |
| `/editor?site=<site>&page=<page>` | The WYSIWYG editor |
| `/pb/<site>/<page>` | Renders a saved page, as a visitor would see it |

Example: <http://localhost:3000/pb/agency/about>

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Dev server on port 3000 |
| `pnpm build` | Production build into `.output/` |
| `pnpm generate` | Static generation |
| `pnpm preview` | Preview the production build locally |
| `pnpm export:site <site> [outDir] [--only=index,about]` | Export one site as a standalone Nuxt project |

There is no test or lint script. To check a change, run `pnpm build`, then try the editor and a `/pb/...` page in `pnpm dev`.

## Template sites

Three starter sites live in `public/sites/`. They use the same blocks with different page settings:

| Site | Brand | Look | Pages |
|---|---|---|---|
| `saas` (default) | Lumen | Indigo, Inter, soft corners | `index`, `pricing`, `contact` |
| `agency` | Northbound | Lime on dark, Space Grotesk, sharp corners | `index`, `about`, `contact` |
| `business` | Evergreen Partners | Teal, Fraunces headings, round corners | `index`, `about`, `contact` |

Their photos are hotlinked from Unsplash, not stored in the repo.

## Using the editor

1. Pick a site with 🌐 and a page from the **Pages** menu. Opening a page that doesn't exist creates it, with the header and footer copied from the site's `index` page.
2. Add blocks and edit their fields in the side panel. Fields are grouped into tabs (Content, Style, Visual, …).
3. Open ⚙ **Page settings** to change the theme and layout of the page.
4. Click **Save**. The page is written to `public/sites/<site>/pages/<page>.json` (with the default storage).
5. Click **Export ⬇** to download `<site>-site.zip`. The export uses saved pages only, so the editor offers to save first.

Writing tips:

- Wrap words in a title with `*asterisks*` to highlight them.
- In link-list textareas, write one link per line as `Label | /path`.
- Use site-relative links such as `/about`. They work in the editor, on `/pb/...` pages and in the exported site.
- For an icon field, type an [MDI icon](https://pictogrammers.com/library/mdi/) name such as `mdi-rocket-launch`.
- Image fields accept JPEG, PNG, GIF or WebP up to 10 MB. Larger files are ignored and the old image stays.

## Exporting a site

From the command line:

```bash
pnpm export:site saas                 # writes ../exported-saas
pnpm export:site agency ../my-agency  # custom output folder
pnpm export:site saas --only=index,pricing
```

> **Warning:** the output folder is deleted and recreated on every export.

Then run the exported project:

```bash
cd ../exported-saas
pnpm install
pnpm dev
```

The exported project contains real `.vue` pages, images extracted to `public/img/`, uploaded media copied into `public/`, only the components it uses, and `three` only when a 3D visual is used. It does not depend on `vue-wswg-editor`.

## Configuration

All settings are optional. Set them as environment variables (for example in a `.env` file, which is gitignored).

### Page storage

| Variable | Default | Description |
|---|---|---|
| `NUXT_PAGE_STORAGE` | `filesystem` | `filesystem` writes JSON into `public/sites/`. `http` saves to a REST backend (use this on serverless hosts). |
| `NUXT_PAGE_STORAGE_URL` | | Backend base URL. Required for `http`. |
| `NUXT_PAGE_STORAGE_COLLECTION` | `pages` | Collection holding pages (`site`, `slug`, `data` fields) |
| `NUXT_PAGE_STORAGE_MENU_COLLECTION` | `site_menu` | Collection holding each site's shared menu (`site`, `menus` fields) |
| `NUXT_PAGE_STORAGE_TOKEN` | | Bearer token for the backend |

The `http` driver expects Directus-style endpoints (`/items/<collection>`). The editor and published pages read pages through `/api/page`, so they work with either driver.

### Uploads

| Variable | Default | Description |
|---|---|---|
| `NUXT_UPLOAD_STORAGE` | same as page storage | `filesystem` saves to `NUXT_UPLOAD_DIR` and serves files at `/uploads/<file>`. `http` posts them to Directus `/files`. |
| `NUXT_UPLOAD_DIR` | `.data/uploads` | Upload folder. It must be on a disk that survives restarts. |
| `NUXT_UPLOAD_MAX_MB` | `50` | Maximum upload size |

### Live data for blocks

`AppHeader`, `Features`, `Stats`, `Testimonials`, `BlogPreview` and `Gallery` can load rows from a backend: set the block's API collection, limit, sort and field mapping in the editor. The backend URL is resolved in this order:

1. `NUXT_PUBLIC_API_BASE`
2. `BACKEND_ADDR` in `public/env.json`
3. `http://localhost:8055`

A collection name becomes `<base>/items/<collection>`. A `/path` or a full URL is used as given.

## Deployment

```bash
pnpm build
node .output/server/index.mjs
```

- With `filesystem` storage, the server needs a **writable, persistent disk** for `public/sites/` and the upload folder.
- On serverless hosts such as **Vercel**, the disk is read-only, so the default `filesystem` driver can't list, create or save sites. Use `NUXT_PAGE_STORAGE=http` with a Directus backend (see [Vercel](#vercel) below).
- **The save and upload endpoints have no authentication.** Put the builder behind a login or a private network when you host it. Deploy exported sites publicly instead.

### Vercel

1. In Directus, create two collections:
   - `pages` with fields `site` (string), `slug` (string) and `data` (JSON);
   - `site_menu` with fields `site` (string) and `menus` (JSON).
2. Create a Directus token (or role) that can read, create and update both collections, plus `directus_files` if you want uploads.
3. In Vercel → Project → Settings → Environment Variables, set:
   ```
   NUXT_PAGE_STORAGE=http
   NUXT_PAGE_STORAGE_URL=https://your-directus.example.com
   NUXT_PAGE_STORAGE_TOKEN=<token>
   ```
4. Redeploy.

With `http` storage, a new site shows up in the 🌐 list once its first page is saved. The template sites in `public/sites/` are not copied into Directus automatically.

## Project structure

```
app/
  pages/                    # index (redirect), editor, pb/[site]/[page]
  page-builder/default/     # the editor theme
    layout/default.vue      # page wrapper + Page settings fields
    blocks/<name>/          # <Name>.vue wrapper + fields.ts per block
  components/               # display components used by the blocks (Pb* shared pieces)
  composables/              # useCollection (live data)
  utils/                    # pb.ts helpers, pb-fields.ts field builders, api.ts, image-resize.ts
  assets/css/main.css       # Tailwind entry, theme tokens, fonts
server/
  api/                      # sites, pages, menu, save-page, create-site, upload, export
  utils/storage/            # PageStorage adapters (filesystem, http)
  utils/media.ts            # upload storage
  routes/uploads/           # serves uploaded files (with Range support)
  middleware/               # iframe preview fix for the dev server
scripts/
  export-site.ts            # pnpm export:site
  export/core.ts            # export logic shared with the Export button
  export/manifest.ts        # block type -> component/props map
public/sites/<site>/        # menu.json + pages/<page>.json for each site
```

## Adding or changing a block

1. Create `app/page-builder/default/blocks/<snake_name>/<PascalName>.vue` and `fields.ts`. The block `type` in page JSON is the PascalCase file name.
2. Wrap the `fields.ts` export in `blockFields({...})` from `app/utils/pb-fields.ts`, otherwise fields without a `group` are hidden.
3. Keep the wrapper thin: an untyped `defineProps([...])` passed with `v-bind="props"` to a display component in `app/components/`.
4. Use the theme utilities (`bg-brand`, `text-brand-text`, `font-display`, `rounded-card`, …) instead of fixed colours, so Page settings can re-theme the block.
5. Use `RouterLink` from `vue-router` for internal links, **not** `NuxtLink`. `NuxtLink` crashes the editor preview.
6. Add the block to `scripts/export/manifest.ts` so the exporter knows about it.

See [CLAUDE.md](CLAUDE.md) for the full architecture notes and conventions.
