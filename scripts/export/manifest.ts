/**
 * Block -> component mapping used by the site exporter.
 *
 * Each page-builder block is a thin wrapper that maps its editor fields onto a
 * plain display component in app/components/. This manifest restates that
 * mapping so the exporter can emit direct component usage instead of the
 * wrapper, letting the exported site drop vue-wswg-editor entirely.
 *
 * Keep in sync with app/page-builder/default/blocks/<name>/<Name>.vue — if a
 * wrapper's template changes, the matching entry here changes too.
 */

export interface BlockMapping {
  /** Component file in app/components/ (without .vue). */
  component: string;
  /** Build the props the component receives from the saved block data. */
  props: (block: Record<string, any>) => Record<string, any>;
}

const passthrough =
  (...keys: string[]) =>
  (block: Record<string, any>) =>
    Object.fromEntries(keys.filter((k) => block[k] !== undefined).map((k) => [k, block[k]]));

/**
 * List blocks can pull their rows from a backend collection instead of the
 * static content saved in the page. Carry those settings into the export so
 * the standalone site stays dynamic.
 */
const API_PROPS = ["apiCollection", "apiLimit", "apiSort", "apiFields"];

/** Carry a block's API data-source settings (only when one is configured). */
const apiProps = (block: Record<string, any>) =>
  block.apiCollection
    ? Object.fromEntries(API_PROPS.filter((k) => block[k]).map((k) => [k, block[k]]))
    : {};

const withApi =
  (...keys: string[]) =>
  (block: Record<string, any>) => ({ ...passthrough(...keys)(block), ...apiProps(block) });

export const BLOCK_MANIFEST: Record<string, BlockMapping> = {
  // --- modern block kit: each wrapper passes its fields straight through ---

  AppHeader: {
    component: "AppHeader",
    props: withApi("logo", "brandName", "menus", "ctaLabel", "ctaLink", "secondaryLabel", "secondaryLink", "variant", "sticky"),
  },

  Hero: {
    component: "Hero",
    props: passthrough(
      "badge", "badgeLink", "badgeTag", "title", "subtitle", "primaryLabel", "primaryLink", "secondaryLabel",
      "secondaryLink", "note", "layout", "visual", "image", "mockupStats", "video", "videoPoster", "shape", "model", "autoRotate", "tilt", "background", "backgroundImage", "backgroundVideo", "tone"
    ),
  },

  Banner: {
    component: "Banner",
    props: passthrough("eyebrow", "title", "subtitle", "breadcrumb", "homeLabel", "align", "background", "backgroundImage", "tone"),
  },

  LogoCloud: { component: "LogoCloud", props: passthrough("title", "logos", "tone", "space") },

  Features: {
    component: "Features",
    props: withApi("eyebrow", "title", "subtitle", "items", "linkLabel", "layout", "columns", "align", "tone", "space", "anchor"),
  },

  Content: {
    component: "Content",
    props: passthrough(
      "eyebrow", "title", "body", "bullets", "buttonLabel", "buttonLink", "linkLabel", "linkLink",
      "visual", "image", "mockupStats", "aspect", "mediaSide", "tone", "space", "anchor"
    ),
  },

  Stats: { component: "Stats", props: withApi("eyebrow", "title", "subtitle", "items", "variant", "align", "tone", "space") },

  Testimonials: {
    component: "Testimonials",
    props: withApi("eyebrow", "title", "subtitle", "items", "layout", "showRating", "align", "tone", "space"),
  },

  Pricing: { component: "Pricing", props: passthrough("eyebrow", "title", "subtitle", "plans", "note", "tone", "space", "anchor") },

  Faq: {
    component: "Faq",
    props: passthrough("eyebrow", "title", "subtitle", "items", "contactLabel", "contactLink", "layout", "openFirst", "tone", "space", "anchor"),
  },

  Team: { component: "Team", props: passthrough("eyebrow", "title", "subtitle", "members", "align", "tone", "space") },

  CTA: {
    component: "CTA",
    props: passthrough(
      "eyebrow", "title", "subtitle", "primaryLabel", "primaryLink", "secondaryLabel", "secondaryLink",
      "variant", "align", "tone", "space"
    ),
  },

  ContactForm: {
    component: "ContactForm",
    props: passthrough(
      "eyebrow", "title", "subtitle", "details", "showPhone", "topics", "submitLabel", "successMessage", "nameLabel", "emailLabel", "phoneLabel", "topicLabel", "messageLabel", "errorMessage",
      "endpoint", "tone", "space", "anchor"
    ),
  },

  BlogPreview: {
    component: "BlogPreview",
    props: withApi("eyebrow", "title", "subtitle", "posts", "buttonLabel", "buttonLink", "tone", "space"),
  },

  Gallery: {
    component: "Gallery",
    props: withApi("eyebrow", "title", "subtitle", "images", "layout", "align", "tone", "space"),
  },

  Footer: {
    component: "Footer",
    props: passthrough("logo", "brandName", "description", "columns", "socials", "legal", "copyright", "tone"),
  },
};
