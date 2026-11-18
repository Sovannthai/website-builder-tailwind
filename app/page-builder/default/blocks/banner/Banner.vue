<template>
  <BannerView v-bind="props" />
</template>

<script setup lang="ts">
import BannerView from '~/components/Banner.vue'

defineOptions({ label: "Page header", emoji: "🏷️" })

// Untyped on purpose (see app_header/AppHeader.vue). Keep in sync with fields.ts.
const props = defineProps(['eyebrow', 'title', 'subtitle', 'breadcrumb', 'homeLabel', 'align', 'background', 'backgroundImage', 'tone'])
</script>
