<template>
  <CTAView v-bind="props" />
</template>

<script setup lang="ts">
import CTAView from '~/components/CTA.vue'

defineOptions({ label: "Call to action", emoji: "📣" })

// Untyped on purpose (see app_header/AppHeader.vue). Keep in sync with fields.ts.
const props = defineProps([
  'eyebrow', 'title', 'subtitle', 'primaryLabel', 'primaryLink', 'secondaryLabel', 'secondaryLink',
  'variant', 'align', 'tone', 'space',
])
</script>
