import { createReadStream } from "node:fs";
import { createError, defineEventHandler, getRequestHeader, getRouterParam, sendStream, setResponseHeaders, setResponseStatus } from "h3";
import { MEDIA_TYPES, uploadedFile } from "../../utils/media";

/**
 * GET /uploads/<file> — serves files saved by the filesystem upload driver.
 * Supports Range requests: Safari won't play a video without them, and
 * browsers use them to seek.
 */
export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, "name") || "";
  const file = await uploadedFile(name);
  if (!file) throw createError({ statusCode: 404, statusMessage: "Not found" });

  const ext = name.split(".").pop()!;
  setResponseHeaders(event, {
    "Content-Type": MEDIA_TYPES[ext]?.mime ?? "application/octet-stream",
    "Accept-Ranges": "bytes",
    // Names are content hashes, so a file never changes.
    "Cache-Control": "public, max-age=31536000, immutable",
  });

  const range = /^bytes=(\d*)-(\d*)$/.exec(getRequestHeader(event, "range") || "");
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : file.size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : file.size - 1;
    start = Math.max(0, start);
    end = Math.min(end, file.size - 1);
    if (start > end) {
      setResponseHeaders(event, { "Content-Range": `bytes */${file.size}` });
      throw createError({ statusCode: 416, statusMessage: "Range Not Satisfiable" });
    }
    setResponseStatus(event, 206);
    setResponseHeaders(event, {
      "Content-Range": `bytes ${start}-${end}/${file.size}`,
      "Content-Length": String(end - start + 1),
    });
    return sendStream(event, createReadStream(file.path, { start, end }));
  }

  setResponseHeaders(event, { "Content-Length": String(file.size) });
  return sendStream(event, createReadStream(file.path));
});
