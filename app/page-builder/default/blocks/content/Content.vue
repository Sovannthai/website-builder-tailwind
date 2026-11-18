<template>
  <ContentView v-bind="props" />
</template>

<script setup lang="ts">
import ContentView from '~/components/Content.vue'

defineOptions({ label: "Text + image", emoji: "📰" })

// Untyped on purpose (see app_header/AppHeader.vue). Keep in sync with fields.ts.
const props = defineProps([
  'eyebrow', 'title', 'body', 'bullets', 'buttonLabel', 'buttonLink', 'linkLabel', 'linkLink',
  'visual', 'image', 'mockupStats', 'aspect', 'mediaSide', 'tone', 'space', 'anchor',
])
</script>
