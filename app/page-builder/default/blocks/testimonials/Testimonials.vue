<template>
  <TestimonialsView v-bind="props" />
</template>

<script setup lang="ts">
import TestimonialsView from '~/components/Testimonials.vue'

defineOptions({ label: "Testimonials", emoji: "💬" })

// Untyped on purpose (see app_header/AppHeader.vue). Keep in sync with fields.ts.
const props = defineProps([
  'eyebrow', 'title', 'subtitle', 'items', 'layout', 'showRating', 'align', 'tone', 'space',
  'apiCollection', 'apiLimit', 'apiSort', 'apiFields',
])
</script>
