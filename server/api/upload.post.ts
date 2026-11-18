import { createError, defineEventHandler, getQuery, readMultipartFormData } from "h3";
import { MEDIA_TYPES, useMediaStorage } from "../utils/media";

/**
 * POST /api/upload?kind=video|model   (multipart form, field "file")
 *
 * Stores a video (.mp4/.webm) or 3D model (.glb) for the Hero's video and
 * model fields and returns { url }. Checked by extension, content and size
 * (runtimeConfig.uploadMaxMb). Images don't come through here: the editor
 * keeps those inline in the page.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event) as any;
  const maxBytes = Number(config.uploadMaxMb || 50) * 1024 * 1024;

  const declared = Number(event.node.req.headers["content-length"] || 0);
  if (declared > maxBytes + 64 * 1024) {
    throw createError({ statusCode: 413, statusMessage: `File is larger than ${config.uploadMaxMb} MB.` });
  }

  const parts = await readMultipartFormData(event);
  const file = parts?.find((p) => p.name === "file" && p.filename);
  if (!file) throw createError({ statusCode: 400, statusMessage: "No file in the upload." });
  if (file.data.length > maxBytes) {
    throw createError({ statusCode: 413, statusMessage: `File is larger than ${config.uploadMaxMb} MB.` });
  }

  const ext = String(file.filename).toLowerCase().split(".").pop() || "";
  const type = MEDIA_TYPES[ext];
  const kind = String(getQuery(event).kind || "");
  const allowed = Object.entries(MEDIA_TYPES)
    .filter(([, t]) => !kind || t.kind === kind)
    .map(([e]) => `.${e}`)
    .join(", ");
  if (!type || (kind && type.kind !== kind)) {
    throw createError({ statusCode: 415, statusMessage: `Unsupported file. Use ${allowed}.` });
  }
  const data = new Uint8Array(file.data);
  if (data.length < 12 || !type.check(data)) {
    throw createError({ statusCode: 415, statusMessage: `That doesn't look like a real .${ext} file.` });
  }

  try {
    const url = await useMediaStorage().save({ data, ext, mime: type.mime, filename: String(file.filename) });
    return { url };
  } catch (err: any) {
    throw createError({ statusCode: 502, statusMessage: `Upload failed: ${err?.message ?? "storage error"}` });
  }
});
