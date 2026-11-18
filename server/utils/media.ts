import { createHash } from "node:crypto";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

/**
 * Where uploaded videos and 3D models go (the editor's Upload button).
 *
 *   filesystem  saved under runtimeConfig.uploadDir (.data/uploads by default)
 *               and served by server/routes/uploads/[name].get.ts as /uploads/<file>.
 *               Needs a disk that survives restarts (a VPS or a Docker volume).
 *   http        posted to the Directus files API at pageStorageUrl; the URL is
 *               Directus's /assets/<id>. For hosts without a lasting disk.
 *
 * runtimeConfig.uploadStorage picks the driver; blank follows pageStorage.
 */
export interface MediaStorage {
  readonly name: string;
  /** Store a file; returns the URL to put in the page. */
  save(file: { data: Uint8Array; ext: string; mime: string; filename: string }): Promise<string>;
}

/** File types the upload endpoint accepts, checked by extension and content. */
export const MEDIA_TYPES: Record<string, { mime: string; kind: "video" | "model"; check: (b: Uint8Array) => boolean }> = {
  mp4: {
    mime: "video/mp4",
    kind: "video",
    check: (b) => String.fromCharCode(b[4]!, b[5]!, b[6]!, b[7]!) === "ftyp",
  },
  webm: {
    mime: "video/webm",
    kind: "video",
    check: (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
  },
  glb: {
    mime: "model/gltf-binary",
    kind: "model",
    check: (b) => String.fromCharCode(b[0]!, b[1]!, b[2]!, b[3]!) === "glTF",
  },
};

/** Stored file names: 16 hex chars + a known extension. Anything else is refused. */
export const UPLOAD_NAME = /^[a-f0-9]{16}\.(mp4|webm|glb)$/;

/** Absolute folder of the filesystem driver. */
export function uploadDirectory(): string {
  return resolve(process.cwd(), String((useRuntimeConfig() as any).uploadDir || ".data/uploads"));
}

/** Path + size of an uploaded file (filesystem driver), or null. */
export async function uploadedFile(name: string): Promise<{ path: string; size: number } | null> {
  if (!UPLOAD_NAME.test(name)) return null;
  const path = join(uploadDirectory(), name);
  try {
    const info = await stat(path);
    return info.isFile() ? { path, size: info.size } : null;
  } catch {
    return null;
  }
}

function filesystemMedia(): MediaStorage {
  return {
    name: "filesystem",
    async save({ data, ext }) {
      // Content-addressed: the same file uploaded twice is stored once.
      const name = `${createHash("sha1").update(data).digest("hex").slice(0, 16)}.${ext}`;
      const dir = uploadDirectory();
      await mkdir(dir, { recursive: true });
      if (!(await uploadedFile(name))) await writeFile(join(dir, name), data);
      return `/uploads/${name}`;
    },
  };
}

function httpMedia(baseUrl: string, token?: string): MediaStorage {
  const base = baseUrl.replace(/\/+$/, "");
  return {
    name: "http",
    async save({ data, mime, filename }) {
      const form = new FormData();
      form.append("file", new Blob([data], { type: mime }), filename);
      const res = await $fetch<{ data?: { id?: string } }>(`${base}/files`, {
        method: "POST",
        body: form,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const id = res?.data?.id;
      if (!id) throw new Error("The files API returned no id.");
      return `${base}/assets/${id}`;
    },
  };
}

let cached: MediaStorage | null = null;

export function useMediaStorage(): MediaStorage {
  if (cached) return cached;
  const config = useRuntimeConfig() as any;
  const driver = String(config.uploadStorage || config.pageStorage || "filesystem");
  if (driver === "http") {
    const url = String(config.pageStorageUrl || "");
    if (!url) throw new Error("[uploads] the http upload driver needs NUXT_PAGE_STORAGE_URL.");
    cached = httpMedia(url, String(config.pageStorageToken || "") || undefined);
  } else {
    cached = filesystemMedia();
  }
  return cached;
}
