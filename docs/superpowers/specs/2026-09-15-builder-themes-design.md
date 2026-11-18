# Multiple page-builder themes with a theme picker

**Date:** 2026-09-15
**Status:** Approved design, ready for implementation planning
**Note:** This project is not a git repository, so no step in this spec assumes a
commit, branch or revert is available.

## Problem

The builder ships one theme. `find app/page-builder -name theme.config.js` returns
only `app/page-builder/default/theme.config.js`, and `app/pages/editor.vue` hardcodes
`theme="default"`. Starting a new website therefore offers no design choice: every
site begins from the same block palette, and the only differentiation available is
editing content.

We want a user creating a website to pick a look up front, from a visual gallery,
and land in an editor already seeded with starter pages in that style.

## Goals

1. Three new self-contained themes — **Studio**, **Launch**, **Market** — each with
   its own blocks, layout, palette and starter pages.
2. A theme gallery in the "+ New website" flow.
3. Per-site theme persistence, so editor and published pages both render a site in
   its chosen theme.
4. The existing `bamboo` blocks extracted from `default` into their own theme.

## Non-goals

- Switching a site's theme after creation. Block types are theme-scoped, so an
  existing page's blocks would not resolve under a different theme. Out of scope.
- A theme marketplace, user-uploaded themes, or per-theme runtime token editing.
- Any change to the legacy static-schema pages (`public/schema.json` and the
  hand-written pages that read it).

## Background: how theming already works

`vue-wswg-editor`'s Vite plugin globs the theme root (`@page-builder`, aliased to
`app/page-builder`):

| Virtual module | Glob |
|---|---|
| `vue-wswg-editor:themes` | `<root>/**/theme.config.js` |
| `vue-wswg-editor:blocks` | `<root>/*/blocks/**/*.vue` |
| `vue-wswg-editor:fields` | `<root>/*/blocks/**/fields.ts` |
| `vue-wswg-editor:layouts` | `<root>/*/layout/**/*.vue` |
| `vue-wswg-editor:thumbnails` | `<root>/*/blocks/**/thumbnail.png`, `<root>/*/thumbnail.{jpg,png}` |

`initialiseRegistry(themeId)` discovers every theme, calls `setActiveTheme(themeId)`,
then loads **only the active theme's** blocks, fields and layout — each sub-registry
filters by `activeTheme.path`. So themes are fully isolated: a theme that does not
define a block cannot render it.

Relevant exports already available: `getThemes()`, `getActiveTheme()`,
`getThemeThumbnail()`, `initialiseRegistry()`. `PageRenderer` accepts a `theme` prop
(default `"default"`) and initialises the registry itself.

**Implication:** the package-side machinery is complete. The work is content
(theme folders) plus wiring (which theme a site uses, and how a user picks it).

## Design

### 1. Per-site theme persistence

Each site gains `public/sites/<site>/site.json`:

```json
{ "theme": "studio" }
```

`PageStorage` (`server/utils/storage/types.ts`) gains:

```ts
export interface SiteMeta {
  theme?: string;
}

// on PageStorage:
getSiteMeta(site: string): Promise<SiteMeta>;
setSiteMeta(site: string, meta: SiteMeta): Promise<void>;
createSite(site: string, meta?: SiteMeta): Promise<string>;   // meta is new
```

- `filesystem.ts`: reads/writes `site.json` next to `menu.json`, reusing the
  existing private `readJson` / `writeJson` helpers.
- `http.ts`: a `sites` collection row (`{ site, theme }`), following the same
  find-then-PATCH-or-POST shape as `getMenu`/`setMenu`. Collection name comes from
  new runtime config `pageStorageSiteCollection` (default `"sites"`), matching the
  existing `pageStorageMenuCollection` pattern.

**A missing `site.json` resolves to `"default"`.** The four existing site folders
(`bamboo`, `default`, `pixel-rise`, `test`) therefore keep working untouched, except
`bamboo`, which gets `{ "theme": "bamboo" }` written as part of section 5.

*Why a per-site file rather than one central registry file:* it matches the existing
one-folder-per-site layout, avoids a shared document that concurrent site creations
would contend on, and maps cleanly onto a row in the `http` driver.

New endpoint `server/api/site.get.ts` → `{ site, theme }`, so the editor and the
public renderer can resolve a site's theme. `server/api/create-site.post.ts` accepts
`{ site, theme }`, validates the theme against the known theme ids (see §2), and
passes it to `createSite`.

### 2. Theme gallery in "+ New website"

`createSite()` in `app/pages/editor.vue` currently calls `window.prompt` for a name.
It becomes a modal with a name field and a grid of theme cards.

The card data comes from the **client registry**, not a new server API:
`getThemes()` returns every discovered theme's `{ id, title, description, tags }`,
and `getThemeThumbnail(theme.path)` returns its preview image. Theme configs are
already a client-side virtual module, so duplicating that list server-side would
only create a second source of truth.

Each theme ships a `thumbnail.png` at its folder root — the glob for those already
exists in the Vite plugin.

The server still needs to reject an unknown theme on `create-site`. Since the server
cannot import the Vite virtual module, `create-site.post.ts` validates by checking
that `app/page-builder/<slug>/theme.config.js` exists on disk (`sanitiseSlug` first,
so the check cannot traverse out of the folder). Unknown or missing ⇒ `"default"`.

On submit: POST `/api/create-site` with `{ site, theme }`, then navigate to
`/editor?site=<slug>&page=index`.

### 3. Editor and renderer honour the site's theme

**`app/pages/editor.vue`** currently calls `initialiseRegistry()` bare, once, in
`onMounted`, and hardcodes `theme="default"` on `WswgPageBuilder`.

Changes:
- Add `siteTheme` ref, resolved from `GET /api/site?site=<site>`.
- `onMounted` calls `initialiseRegistry(siteTheme.value)`.
- Bind `:theme="siteTheme"` on `WswgPageBuilder`.
- Move the re-init into the existing `watch([pageName, siteName])`: when `siteName`
  changes, set `registryReady = false`, re-resolve the theme, re-run
  `initialiseRegistry`, then `applyLayoutSettingDefaults()` and set it back to true.

  **This step is load-bearing.** `selectSite()` navigates with a query change on the
  same route, which does not remount the page — without re-initialising, the block
  palette and canvas would keep rendering the previous site's theme.

**`app/pages/pb/[site]/[page].vue`** fetches the site meta alongside the page JSON
and passes `:theme="siteTheme"` to `PageRenderer`, which handles its own registry
init from that prop.

### 4. The three new themes

Each lives at `app/page-builder/<theme>/` and mirrors `default/`:

```
app/page-builder/<theme>/
  theme.config.js        # title, description, version, author, tags
  thumbnail.png          # gallery card image
  iframe-app.ts          # imports ../../assets/css/main.css + mdi font
  layout/default.vue     # page-settings fields + inline layout styles
  blocks/<block>/
    <Name>.vue
    fields.ts
  starter/
    menu.json
    pages/<page>.json
```

Blocks are **self-contained**: markup and scoped CSS live in the block `.vue`, with
no `~/components/` dependency. Themes stay visually independent and a change to one
cannot alter another.

**Two constraints every block must respect:**

1. Internal links use `RouterLink` imported from `vue-router`, never `NuxtLink`.
   The editor's iframe preview is a bare Vue app with no Nuxt instance; `NuxtLink`'s
   setup calls `useNuxtApp()` and throws `E1001`, blanking the whole editor canvas.
   When choosing a link element dynamically, bind the imported component
   (`:is="path ? RouterLink : 'div'"`), not the string.
2. `fields.ts` and the block's `defineProps` stay in sync, and each block declares
   `defineOptions({ label, emoji })` so it reads well in the block palette.

Each `layout/default.vue` copies the `default` theme's page-settings fields
(`containerWidth`, `maxWidth`, `pagePadding`, `footerSpacing`) so the ⚙ panel keeps
working, with per-theme defaults (Studio and Market default to `full` width).

#### Theme character

| | **Studio** | **Launch** | **Market** |
|---|---|---|---|
| For | portfolios, agencies, design studios | apps, startups, tools | retail, catalogues, small shopfronts |
| Palette | near-black `#111` on paper `#faf8f5`, ochre accent `#c8892f` | indigo→violet gradient, white cards on `#f7f7fb` | warm sand `#f5efe6`, terracotta accent `#b5563c` |
| Type | oversized display, tight tracking, generous whitespace | medium-weight sans, roomy line height | condensed headings, tabular-figure prices |
| Feel | asymmetric, editorial, restrained | soft shadows, rounded cards, gradients | dense, image-forward, product grid |

#### Block sets

**Studio** (6): `StudioNav` (wordmark + right links over a hairline rule),
`StudioHero` (type-only, no image), `StudioWorkGrid` (project tiles with hover
caption), `StudioSplit` (alternating 50/50 image and text), `StudioQuote` (large
pull quote + attribution), `StudioFooter` (oversized email CTA).

**Launch** (7): `LaunchNav` (logo, links, "Get started" pill), `LaunchHero`
(gradient background, headline, dual CTA, screenshot slot), `LaunchLogoCloud`
(grayscale logo strip), `LaunchFeatureTrio` (three icon cards),
`LaunchPricing` (three tiers, middle highlighted), `LaunchFAQ` (accordion),
`LaunchFooter` (multi-column + signup CTA band).

**Market** (7): `MarketNav` (logo, category links, decorative cart glyph),
`MarketHero` (promo banner, image + CTA), `MarketCategoryTiles` (3–4 image tiles),
`MarketProductGrid` (cards: image, title, price, optional badge),
`MarketLookbook` (masonry gallery), `MarketTestimonials` (three-up quotes),
`MarketFooter`.

20 blocks total. Repeating groups (nav links, work items, pricing tiers, products)
use `createField.repeater`; images use `createField.image`; accent colours use
`createField.color` so a user can retune a theme without editing code.

#### Starter content

| Theme | Pages |
|---|---|
| Studio | `index`, `work`, `contact` |
| Launch | `index`, `pricing`, `contact` |
| Market | `index`, `shop`, `about` |

Starter JSON is authored by hand into `app/page-builder/<theme>/starter/`, in the
same `{ blocks, settings }` shape `savePage` already writes. On site creation the
server reads that folder from disk and writes each page and the menu **through the
storage adapter**, so seeding behaves identically on the `filesystem` and `http`
drivers. Starter files are code, not user content, so reading them from disk is
correct even when pages are stored elsewhere.

Seeding lives in a new `server/utils/seed-site.ts` rather than inside
`create-site.post.ts`, keeping the endpoint a thin handler.

### 5. Bamboo extraction

`app/page-builder/default/blocks/bamboo_*` moves to `app/page-builder/bamboo/blocks/`,
dropping the `bamboo_` folder prefix. **Component names and therefore block `type`
values stay identical** (`BambooNavBar`, `BambooHero`, `BambooCoreValues`,
`BambooObjective`, `BambooLatestPost`), so `public/sites/bamboo/pages/*.json` needs
no rewriting.

The bamboo theme also needs `theme.config.js`, `thumbnail.png`, `iframe-app.ts` and
`layout/default.vue`, copied from `default`.

**The wrinkle:** only the active theme's blocks load, and the bamboo site's pages use
four generic blocks alongside the bamboo ones. Verified by inspecting every block
`type` in `public/sites/bamboo/pages/*.json`:

```
AppFeatureCategory, Banner, BambooCoreValues, BambooHero, BambooLatestPost,
BambooNavBar, BambooObjective, Content, Footer
```

So `AppFeatureCategory`, `Banner`, `Content` and `Footer` are copied from `default`
into the bamboo theme. These four are thin wrappers over `~/components/` (a short
template plus a `fields.ts`), so duplication is cheap. Note bamboo uses
`BambooNavBar`, **not** `AppHeader`.

Finally, `public/sites/bamboo/site.json` is written with `{ "theme": "bamboo" }`.

`pixel-rise`, `default` and `test` keep no `site.json` and fall back to the `default`
theme — which retains every block they use (`AppHeader`, `Banner`, `Content`,
`Slider`, `Features`, `Gallery`, `BlogPreview`, `AppFeatureCategory`, `Footer`).

### 6. Site exporter

`scripts/export/manifest.ts` exports a single flat `BLOCK_MANIFEST`, and
`scripts/export-site.ts` reads it in eight places. Change:

```ts
export const THEME_MANIFESTS: Record<string, Record<string, BlockMapping>> = {
  default: DEFAULT_MANIFEST,
  bamboo:  BAMBOO_MANIFEST,
  studio:  STUDIO_MANIFEST,
  launch:  LAUNCH_MANIFEST,
  market:  MARKET_MANIFEST,
};

export function getBlockManifest(theme = "default"): Record<string, BlockMapping> {
  return THEME_MANIFESTS[theme] ?? THEME_MANIFESTS.default;
}
```

`export-site.ts` reads `public/sites/<site>/site.json` for the theme and resolves the
manifest once at the top, then threads it through instead of importing the constant.
The existing unmapped-block warning path (`rawBlocks.forEach(...)` around line 391)
keeps working unchanged.

The new themes' blocks are self-contained, so their manifest entries use the
`sourceFile` escape hatch that already exists in `BlockMapping` — the exporter copies
the block `.vue` itself rather than emitting a `~/components/` tag.

## Files touched

**New**
- `app/page-builder/{studio,launch,market,bamboo}/**` — theme folders
- `server/api/site.get.ts`
- `server/utils/seed-site.ts`
- `app/components/editor/NewSiteDialog.vue` (extracted from `editor.vue` so the
  page does not grow another modal inline). Nuxt auto-imports it by path, so the
  tag is `<EditorNewSiteDialog>`.

**Modified**
- `server/utils/storage/types.ts` — `SiteMeta`, three signature changes
- `server/utils/storage/filesystem.ts`, `http.ts` — implement them
- `server/api/create-site.post.ts` — accept and validate `theme`, seed starter pages
- `nuxt.config.ts` — `pageStorageSiteCollection` runtime config
- `app/pages/editor.vue` — theme resolution, re-init on site change, new dialog
- `app/pages/pb/[site]/[page].vue` — pass `:theme`
- `scripts/export/manifest.ts`, `scripts/export-site.ts` — per-theme manifests
- `public/sites/bamboo/site.json` — new file pinning the bamboo theme
- `CLAUDE.md` — document the theme system and the picker

**Deleted**
- `app/page-builder/default/blocks/bamboo_*` — only after verification item 2 passes
  against the copies in the new theme folder

## Verification

The repo has no test suite and no lint script, so verification is manual against
`pnpm dev`. Each item is a pass/fail check, run in order:

1. `/editor?site=default&page=index` renders as it does today; canvas is not blank.
2. `/editor?site=bamboo&page=index` renders every bamboo block after extraction, and
   `/pb/bamboo/index` matches it.
3. `/pb/pixel-rise/index` and `/pb/pixel-rise/product` unchanged.
4. "+ New website" shows exactly five theme cards — Default, Bamboo, Studio, Launch,
   Market — each with a thumbnail and description.
5. Creating a site on each new theme lands in the editor with starter pages present,
   the theme's own block palette, and a canvas that renders — **blank canvas means an
   `E1001` `NuxtLink` regression**, so check the iframe console on failure.
6. Saving a page writes `public/sites/<slug>/pages/<page>.json`; reloading restores it.
7. Switching sites via 🌐 between two different-theme sites swaps the block palette
   without a manual refresh.
8. Editing the shared menu on one page updates it across that site's pages.
9. `pnpm export:site <studio-site>` and `pnpm export:site bamboo` both emit a project
   with no `vue-wswg-editor` dependency and no unmapped-block warnings.
10. `pnpm build` completes.

## Risks

| Risk | Mitigation |
|---|---|
| Bamboo extraction breaks a live site | The block-type inventory above was taken from the actual page JSON; verification items 2 and 9 cover it. This project is **not a git repository**, so there is no commit to revert: copy `bamboo_*` into the new theme and delete the originals only after item 2 passes. |
| A new block uses `NuxtLink` and blanks the editor | Called out as a hard constraint per block; verification item 5 checks every theme. |
| 20 blocks is a large surface to review at once | Implement and verify Studio end-to-end first, get sign-off, then Launch and Market. |
| Exporter drifts from the block wrappers | `manifest.ts` already carries a "keep in sync" note; extend it to name all five themes. |

## Implementation order

1. Storage: `SiteMeta`, adapters, `site.get.ts`, `create-site` theme param.
2. Editor and renderer read the theme (still only `default` available — no visible change).
3. Bamboo extraction, verified against the live bamboo site.
4. Theme gallery dialog.
5. **Studio** theme: blocks, layout, starter pages, manifest entries. **Review gate.**
6. **Launch**, then **Market**, the same way.
7. Exporter per-theme manifests; `CLAUDE.md` update.

Steps 1–4 ship behind an unchanged user experience, so each can be verified on its
own before any new theme exists.
