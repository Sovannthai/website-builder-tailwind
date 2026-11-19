import { createError, defineEventHandler, getQuery } from "h3";
import { usePageStorage } from "../utils/storage";
import { DEFAULT_SITE, sanitiseSlug } from "../utils/storage/types";

/**
 * One saved page, read through the storage adapter. The editor and the /pb
 * renderer use this instead of fetching /sites/<site>/pages/<page>.json
 * directly, so pages also load when they live in a backend (NUXT_PAGE_STORAGE=http).
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const site = sanitiseSlug(String(query.site ?? ""), DEFAULT_SITE);
  const page = sanitiseSlug(String(query.page ?? ""), "index");
  const data = await usePageStorage().getPage(site, page);
  if (!data) {
    throw createError({ statusCode: 404, statusMessage: "Page not found" });
  }
  return data;
});
