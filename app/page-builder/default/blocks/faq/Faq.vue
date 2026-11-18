<template>
  <FaqView v-bind="props" />
</template>

<script setup lang="ts">
import FaqView from '~/components/Faq.vue'

defineOptions({ label: "FAQ", emoji: "❓" })

// Untyped on purpose (see app_header/AppHeader.vue). Keep in sync with fields.ts.
const props = defineProps([
  'eyebrow', 'title', 'subtitle', 'items', 'contactLabel', 'contactLink', 'layout', 'openFirst',
  'tone', 'space', 'anchor',
])
</script>
