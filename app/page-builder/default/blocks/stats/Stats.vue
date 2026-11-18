<template>
  <StatsView v-bind="props" />
</template>

<script setup lang="ts">
import StatsView from '~/components/Stats.vue'

defineOptions({ label: "Stats", emoji: "📊" })

// Untyped on purpose (see app_header/AppHeader.vue). Keep in sync with fields.ts.
const props = defineProps([
  'eyebrow', 'title', 'subtitle', 'items', 'variant', 'align', 'tone', 'space',
  'apiCollection', 'apiLimit', 'apiSort', 'apiFields',
])
</script>
