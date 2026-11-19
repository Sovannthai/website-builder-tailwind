<script setup lang="ts">
import { PageRenderer } from "vue-wswg-editor";

// Opt out of the site-wide Nuxt layout: the page-builder renders its own
// layout wrapper, and we don't want the site chrome (AppHeader/Footer) around
// a published page-builder page.
definePageMeta({ layout: false });

// Blocks paint their own section backgrounds; keep the page itself white so
// full-width sites have no grey edges.
useHead({ bodyAttrs: { style: "background-color: #ffffff;" } });

const route = useRoute();
const siteName = computed(() => String(route.params.site));
const pageName = computed(() => String(route.params.page));

const { data: pbData } = await useAsyncData(`pb-${siteName.value}-${pageName.value}`, () =>
  $fetch<Record<string, any>>("/api/page", {
    query: { site: siteName.value, page: pageName.value },
  }).catch(() => null)
);

// 404 if this site has no such page
if (!pbData.value?.blocks?.length) {
  throw createError({ statusCode: 404, statusMessage: "Page not found" });
}

// The header navigation is shared across a site's pages: inject the canonical
// menu into any AppHeader block so every page shows the same menu, even if this
// page wasn't re-saved after the menu was last edited.
const { data: sharedMenu } = await useAsyncData(`pb-menu-${siteName.value}`, () =>
  $fetch<{ menus: any[] }>("/api/menu", { query: { site: siteName.value } }).catch(() => null)
);
if (Array.isArray(sharedMenu.value?.menus) && sharedMenu.value.menus.length) {
  for (const block of pbData.value.blocks) {
    if (block?.type === "AppHeader") {
      block.menus = sharedMenu.value.menus;
    }
  }
}
</script>

<template>
  <PageRenderer
    :blocks="pbData.blocks"
    :settings="pbData.settings"
    :layout="pbData.settings?.layout || 'default'"
    :with-layout="true"
    theme="default"
  />
</template>
