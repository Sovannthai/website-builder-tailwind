<template>
  <FooterView v-bind="props" />
</template>

<script setup lang="ts">
import FooterView from '~/components/Footer.vue'

defineOptions({ label: "Footer", emoji: "🔻" })

// Untyped on purpose (see app_header/AppHeader.vue). Keep in sync with fields.ts.
const props = defineProps(['logo', 'brandName', 'description', 'columns', 'socials', 'legal', 'copyright', 'tone'])
</script>
