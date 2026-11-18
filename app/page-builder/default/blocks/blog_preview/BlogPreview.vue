<template>
  <BlogPreviewView v-bind="props" />
</template>

<script setup lang="ts">
import BlogPreviewView from '~/components/BlogPreview.vue'

defineOptions({ label: "Blog posts", emoji: "📝" })

// Untyped on purpose (see app_header/AppHeader.vue). Keep in sync with fields.ts.
const props = defineProps([
  'eyebrow', 'title', 'subtitle', 'posts', 'buttonLabel', 'buttonLink', 'tone', 'space',
  'apiCollection', 'apiLimit', 'apiSort', 'apiFields',
])
</script>
