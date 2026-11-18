import { zipSync } from "fflate";
import { createError, defineEventHandler, getQuery, getRequestURL, setResponseHeaders } from "h3";
import { buildSiteExport, fileBytes, type ExportSource } from "../../scripts/export/core";
import { usePageStorage } from "../utils/storage";
import { DEFAULT_SITE, sanitiseSlug } from "../utils/storage/types";
import { uploadedFile } from "../utils/media";
import { readFile } from "node:fs/promises";

/**
 * GET /api/export?site=<site>
 *
 * The editor's "Export" button: the same standalone Nuxt project as
 * `pnpm export:site`, sent as <site>.zip, so a hosted builder can export
 * without a command line. Pages come from the page storage adapter; the
 * component source comes from the server assets bundled in nuxt.config.ts.
 */

const SOURCE_DIRS = ["components", "utils", "composables", "assets"];

function toBytes(value: unknown): Uint8Array | null {
  if (value == null) return null;
  // ArrayBuffer.isView / toString instead of instanceof: in dev, Nitro runs in
  // a worker whose typed-array classes aren't the ones this module sees.
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength).slice();
  if (Object.prototype.toString.call(value) === "[object ArrayBuffer]") return new Uint8Array(value as ArrayBuffer);
  if (typeof value === "string") return new TextEncoder().encode(value);
  return null;
}

/** "components/Hero.vue" -> storage + key of the bundled server asset. */
function assetLocation(path: string) {
  const [dir, ...rest] = path.split("/");
  if (!dir || !SOURCE_DIRS.includes(dir) || !rest.length) return null;
  return { base: `assets:export-${dir}`, key: rest.join(":") };
}

export default defineEventHandler(async (event) => {
  const storage = usePageStorage();
  const site = sanitiseSlug(String(getQuery(event).site ?? ""), DEFAULT_SITE);
  if (!(await storage.listSites()).includes(site)) {
    throw createError({ statusCode: 404, statusMessage: `No website "${site}".` });
  }

  const assets = useStorage();
  const source: ExportSource = {
    async readSource(path) {
      const loc = assetLocation(path);
      return loc ? toBytes(await assets.getItemRaw(`${loc.base}:${loc.key}`)) : null;
    },
    async listSource(dir) {
      const base = `assets:export-${dir}`;
      const keys = await assets.getKeys(base);
      return keys.map((k) => `${dir}/${k.replace(`${base}:`, "").split(":").join("/")}`);
    },
    async readPublic(urlPath) {
      if (urlPath.startsWith("/uploads/")) {
        const file = await uploadedFile(urlPath.slice("/uploads/".length));
        return file ? new Uint8Array(await readFile(file.path)) : null;
      }
      // Anything else under public/ (env.json, images): ask our own server.
      // The internal fetch skips the network but doesn't see public/ in dev,
      // so fall back to a real request to this server's own address.
      for (const url of [urlPath, `${getRequestURL(event).origin}${urlPath}`]) {
        try {
          const res = await $fetch.raw(url, { responseType: "arrayBuffer" });
          // Unknown paths get the SPA's HTML shell, not a 404: that's not the file.
          if (String(res.headers.get("content-type")).includes("text/html") && !urlPath.endsWith(".html")) continue;
          const bytes = toBytes(res._data);
          if (bytes?.length) return bytes;
        } catch {
          /* try the next way */
        }
      }
      return null;
    },
    listPages: () => storage.listPages(site),
    getPage: (slug) => storage.getPage(site, slug),
    getMenu: () => storage.getMenu(site),
  };

  let result;
  try {
    result = await buildSiteExport(site, source);
  } catch (err: any) {
    throw createError({ statusCode: 400, statusMessage: err?.message ?? "Export failed" });
  }

  // Everything inside a <site>/ folder, so unzipping doesn't spill files.
  const entries: Record<string, Uint8Array> = {};
  for (const [path, contents] of result.files) entries[`${site}/${path}`] = fileBytes(contents);
  const zip = zipSync(entries, { level: 6 });

  setResponseHeaders(event, {
    "Content-Type": "application/zip",
    "Content-Disposition": `attachment; filename="${site}-site.zip"`,
    "Content-Length": String(zip.length),
    // Shown by the editor after the download starts.
    "X-Export-Warnings": encodeURIComponent(result.warnings.join(" | ")),
    "Cache-Control": "no-store",
  });
  return Buffer.from(zip);
});
