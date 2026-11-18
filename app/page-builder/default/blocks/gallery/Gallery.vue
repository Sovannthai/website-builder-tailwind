<template>
  <GalleryView v-bind="props" />
</template>

<script setup lang="ts">
import GalleryView from '~/components/Gallery.vue'

defineOptions({ label: "Gallery", emoji: "🖼️" })

// Untyped on purpose (see app_header/AppHeader.vue). Keep in sync with fields.ts.
const props = defineProps([
  'eyebrow', 'title', 'subtitle', 'images', 'layout', 'align', 'tone', 'space',
  'apiCollection', 'apiLimit', 'apiSort', 'apiFields',
])
</script>
