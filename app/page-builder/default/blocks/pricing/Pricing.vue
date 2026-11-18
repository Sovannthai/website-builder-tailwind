<template>
  <PricingView v-bind="props" />
</template>

<script setup lang="ts">
import PricingView from '~/components/Pricing.vue'

defineOptions({ label: "Pricing", emoji: "💳" })

// Untyped on purpose (see app_header/AppHeader.vue). Keep in sync with fields.ts.
const props = defineProps(['eyebrow', 'title', 'subtitle', 'plans', 'note', 'tone', 'space', 'anchor'])
</script>
