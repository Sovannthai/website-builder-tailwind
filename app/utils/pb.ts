/**
 * Small helpers shared by the modern page-builder blocks.
 *
 * Kept free of Nuxt composables: blocks also render inside the editor's
 * iframe preview, which is a bare Vue app with no Nuxt instance.
 */

/** Editor selects and booleans arrive as true/"true"/false/"false". */
export function truthy(value: unknown): boolean {
  return value === true || value === "true";
}

/** Black or white, whichever reads better on the given hex colour. */
export function readableInk(hex: string): string {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!m) return "#ffffff";
  let h = m[1]!;
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * lin(r!) + 0.7152 * lin(g!) + 0.0722 * lin(b!);
  return luminance > 0.45 ? "#0f172a" : "#ffffff";
}

/**
 * The builder site a block is being shown for, or "" on an exported site:
 * - published preview: /pb/<site>/<page>
 * - editor: /editor?site=<site>; blocks render in the editor's iframe, so
 *   read the parent window's URL (same origin).
 */
export function currentPbSite(): string {
  if (typeof window === "undefined") return "";
  const pb = /^\/pb\/([^/]+)/.exec(window.location.pathname);
  if (pb) return decodeURIComponent(pb[1]!);
  const editorSite = (loc: Location) =>
    loc.pathname.startsWith("/editor") ? new URLSearchParams(loc.search).get("site") || "" : "";
  try {
    return editorSite(window.location) || (window.parent !== window ? editorSite(window.parent.location) : "");
  } catch {
    return ""; // cross-origin parent
  }
}

/** "/pb/<site>/<page>#hash" -> { site, page, hash }, or null for other links. */
export function parsePbHref(href: string): { site: string; page: string; hash: string } | null {
  const m = /^\/pb\/([^/#?]+)\/([^/#?]+)(?:#(.*))?$/.exec(href);
  return m ? { site: decodeURIComponent(m[1]!), page: decodeURIComponent(m[2]!), hash: m[3] ?? "" } : null;
}

/**
 * Site-relative links ("/pricing") point at the real route on an exported
 * site. Inside the builder (the /pb/<site>/<page> preview or the editor) the
 * same link has to stay inside the current site: /pb/<site>/pricing.
 */
export function pbHref(path?: string): string {
  const value = (path ?? "").trim();
  if (!value) return "#";
  if (!value.startsWith("/") || value.startsWith("//")) return value; // external, #anchor, mailto:
  if (value.startsWith("/pb/")) return value;
  const site = currentPbSite();
  if (!site) return value;
  const [pathPart, hash = ""] = value.split("#");
  const page = pathPart === "/" ? "index" : pathPart!.replace(/^\/+|\/+$/g, "") || "index";
  return `/pb/${encodeURIComponent(site)}/${page}${hash ? `#${hash}` : ""}`;
}

/** "rocket-launch" or "mdi-rocket-launch" -> "mdi mdi-rocket-launch". */
export function mdiClass(icon?: string): string {
  const name = (icon ?? "").trim().replace(/^mdi[- ]/, "");
  return name ? `mdi mdi-${name}` : "";
}

/** One item per non-empty line. */
export function lines(text?: string): string[] {
  return String(text ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/** "Label | /path" lines -> links. A line without "|" links to "#". */
export function linkLines(text?: string): Array<{ label: string; href: string }> {
  return lines(text).map((line) => {
    const [label, href] = line.split("|").map((s) => s.trim());
    return { label: label || "", href: href || "#" };
  });
}

/**
 * Split a heading on *asterisks* so the marked words can be highlighted:
 * "Build *faster* sites" -> [{text:"Build "}, {text:"faster", mark:true}, …]
 */
export function markedSegments(text?: string): Array<{ text: string; mark: boolean }> {
  return String(text ?? "")
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("*") && part.endsWith("*") && part.length > 2
        ? { text: part.slice(1, -1), mark: true }
        : { text: part, mark: false }
    );
}

/** Up to two initials for an avatar placeholder. */
export function initials(name?: string): string {
  return String(name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/** Section tones every modern block offers. */
export type PbTone = "light" | "muted" | "dark" | "brand";

export const TONE_OPTIONS = [
  { label: "Light", value: "light", id: "tone-light" },
  { label: "Muted", value: "muted", id: "tone-muted" },
  { label: "Dark", value: "dark", id: "tone-dark" },
  { label: "Brand colour", value: "brand", id: "tone-brand" },
];

/** Page settings saved on each page (Page settings panel / layout fields). */
export interface PbPageSettings {
  accentColor?: string;
  font?: string;
  corners?: string;
  containerWidth?: string;
  maxWidth?: string;
  pagePadding?: string;
  footerSpacing?: boolean | string;
}

const PAGE_PADDING: Record<string, string> = { none: "0", small: "1rem", medium: "2rem", large: "4rem" };

const FONT_PAIRS: Record<string, { display: string; body: string }> = {
  modern: { display: '"Inter", sans-serif', body: '"Inter", sans-serif' },
  friendly: { display: '"Plus Jakarta Sans", sans-serif', body: '"Plus Jakarta Sans", sans-serif' },
  tech: { display: '"Space Grotesk", sans-serif', body: '"Inter", sans-serif' },
  editorial: { display: '"Fraunces", Georgia, serif', body: '"Inter", sans-serif' },
};

const CORNER_SIZES: Record<string, { card: string; btn: string }> = {
  sharp: { card: "0.25rem", btn: "0.25rem" },
  soft: { card: "1rem", btn: "0.75rem" },
  round: { card: "1.75rem", btn: "9999px" },
};

/**
 * Turn page settings into the layout wrapper's inline style: container
 * width/padding plus the --pb-* theme variables every modern block reads.
 * Shared by the builder layout and the site exporter so both look the same.
 */
export function pageLayoutStyle(settings: PbPageSettings = {}): Record<string, string> {
  const isFull = (settings.containerWidth ?? "full") !== "boxed";
  const side = PAGE_PADDING[settings.pagePadding ?? "none"] ?? "0";
  const accent = settings.accentColor || "#4f46e5";
  const ink = readableInk(accent);
  // A light accent (lime, yellow…) can't be used for text on white, so light
  // sections get a darkened shade; a dark accent is lifted for dark sections.
  const strong = ink === "#ffffff" ? accent : `color-mix(in oklab, ${accent} 50%, #0f172a)`;
  const soft = ink === "#ffffff" ? `color-mix(in oklab, ${accent} 55%, #ffffff)` : accent;
  const font = FONT_PAIRS[settings.font ?? "modern"] ?? FONT_PAIRS.modern!;
  const corners = CORNER_SIZES[settings.corners ?? "soft"] ?? CORNER_SIZES.soft!;
  return {
    maxWidth: isFull ? "100%" : `${settings.maxWidth ?? "1280"}px`,
    paddingLeft: side,
    paddingRight: side,
    paddingBottom: truthy(settings.footerSpacing) ? "4rem" : "0",
    "--page-side-padding": side,
    "--pb-accent": accent,
    "--pb-accent-ink": ink,
    "--pb-accent-strong": strong,
    "--pb-accent-soft": soft,
    "--pb-brand-text": strong,
    "--pb-font-display": font.display,
    "--pb-font-body": font.body,
    "--pb-radius": corners.card,
    "--pb-radius-btn": corners.btn,
  };
}

/** A stat card in the hero/content "app screenshot" mockup (PbMockup). */
export interface MockupStat {
  label?: string;
  value?: string;
  change?: string;
  trend?: "up" | "down" | string;
}

/** Sample cards, shown when a block has no saved mockup stats. */
export const MOCKUP_STATS: MockupStat[] = [
  { label: "Revenue", value: "$48.2k", change: "+12.4%", trend: "up" },
  { label: "Users", value: "3,904", change: "+8.1%", trend: "up" },
  { label: "Churn", value: "1.2%", change: "-0.4%", trend: "up" },
];
