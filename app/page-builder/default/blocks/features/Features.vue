<template>
  <FeaturesView v-bind="props" />
</template>

<script setup lang="ts">
import FeaturesView from '~/components/Features.vue'

defineOptions({ label: "Features", emoji: "✨" })

// Untyped on purpose (see app_header/AppHeader.vue). Keep in sync with fields.ts.
const props = defineProps([
  'eyebrow', 'title', 'subtitle', 'items', 'linkLabel', 'layout', 'columns', 'align', 'tone', 'space', 'anchor',
  'apiCollection', 'apiLimit', 'apiSort', 'apiFields',
])
</script>
