/**
 * Export one website (project) as a standalone Nuxt project folder.
 *
 *   pnpm export:site <site> [outDir] [--only=index,product]
 *   pnpm export:site saas ../my-site
 *
 * Reads public/sites/<site>/ from disk. The export itself is built by
 * scripts/export/core.ts, which the editor's "Export" button
 * (server/api/export.get.ts) uses too.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile, readdir, rm } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { buildSiteExport, fileBytes, type ExportSource } from "./export/core";

const ROOT = process.cwd();
const APP_DIR = join(ROOT, "app");
const PUBLIC_DIR = join(ROOT, "public");
const SITES_DIR = join(PUBLIC_DIR, "sites");
// Same default as runtimeConfig.uploadDir in nuxt.config.ts
const UPLOAD_DIR = resolve(ROOT, process.env.NUXT_UPLOAD_DIR || ".data/uploads");

async function readOrNull(file: string): Promise<Uint8Array | null> {
  try {
    return new Uint8Array(await readFile(file));
  } catch {
    return null;
  }
}

async function listFiles(dir: string, prefix: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) out.push(...(await listFiles(join(dir, entry.name), rel)));
    else out.push(rel);
  }
  return out;
}

function diskSource(site: string): ExportSource {
  const siteDir = join(SITES_DIR, site);
  return {
    readSource: (path) => readOrNull(join(APP_DIR, path)),
    listSource: (dir) => listFiles(join(APP_DIR, dir), dir),
    readPublic: (urlPath) =>
      urlPath.startsWith("/uploads/")
        ? readOrNull(join(UPLOAD_DIR, urlPath.slice("/uploads/".length)))
        : readOrNull(join(PUBLIC_DIR, urlPath)),
    async listPages() {
      const dir = join(siteDir, "pages");
      if (!existsSync(dir)) return [];
      return (await readdir(dir)).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
    },
    async getPage(slug) {
      const raw = await readOrNull(join(siteDir, "pages", `${slug}.json`));
      return raw ? JSON.parse(new TextDecoder().decode(raw)) : null;
    },
    async getMenu() {
      const raw = await readOrNull(join(siteDir, "menu.json"));
      const parsed = raw ? JSON.parse(new TextDecoder().decode(raw)) : null;
      return Array.isArray(parsed?.menus) ? parsed.menus : [];
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  const only = args
    .find((a) => a.startsWith("--only="))
    ?.slice("--only=".length)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const positional = args.filter((a) => !a.startsWith("--"));
  const site = positional[0];
  const outDir = resolve(ROOT, positional[1] || `../exported-${site ?? "site"}`);

  const available = existsSync(SITES_DIR)
    ? (await readdir(SITES_DIR, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name).sort()
    : [];
  if (!site || !available.includes(site)) {
    console.error(site ? `✗ No website "${site}" (looked in public/sites/)` : `✗ Which website? Usage: pnpm export:site <site> [outDir]`);
    console.error(`  available: ${available.join(", ") || "(none)"}`);
    process.exit(1);
  }

  console.log(`→ exporting "${site}" to ${outDir}`);
  const result = await buildSiteExport(site, diskSource(site), { only });
  result.log.forEach((line) => console.log(`  • ${line}`));

  await rm(outDir, { recursive: true, force: true });
  for (const [path, contents] of result.files) {
    const target = join(outDir, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, fileBytes(contents));
  }

  result.warnings.forEach((w) => console.warn(`  ! ${w}`));
  console.log(`✓ done — cd ${relative(ROOT, outDir)} && pnpm install && pnpm dev`);
}

main().catch((err) => {
  console.error(`✗ ${err?.message ?? err}`);
  process.exit(1);
});
