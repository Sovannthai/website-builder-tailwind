<template>
  <AppHeaderView v-bind="props" />
</template>

<script setup lang="ts">
import AppHeaderView from '~/components/AppHeader.vue'

defineOptions({ label: "Header / Navbar", emoji: "🧭" })

// Untyped on purpose: typed boolean props would turn a missing value into
// `false` and override the view component's defaults. Keep in sync with fields.ts.
const props = defineProps([
  'logo', 'brandName', 'menus', 'ctaLabel', 'ctaLink', 'secondaryLabel', 'secondaryLink',
  'variant', 'sticky', 'apiCollection', 'apiLimit', 'apiSort', 'apiFields',
])
</script>
