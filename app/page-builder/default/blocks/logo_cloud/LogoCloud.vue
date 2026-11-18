<template>
  <LogoCloudView v-bind="props" />
</template>

<script setup lang="ts">
import LogoCloudView from '~/components/LogoCloud.vue'

defineOptions({ label: "Logo cloud", emoji: "🏢" })

// Untyped on purpose (see app_header/AppHeader.vue). Keep in sync with fields.ts.
const props = defineProps(['title', 'logos', 'tone', 'space'])
</script>
