<template>
  <HeroView v-bind="props" />
</template>

<script setup lang="ts">
import HeroView from '~/components/Hero.vue'

defineOptions({ label: "Hero", emoji: "🚀" })

// Untyped on purpose (see app_header/AppHeader.vue). Keep in sync with fields.ts.
const props = defineProps([
  'badge', 'badgeLink', 'badgeTag', 'title', 'subtitle', 'primaryLabel', 'primaryLink', 'secondaryLabel',
  'secondaryLink', 'note', 'layout', 'visual', 'image', 'mockupStats', 'video', 'videoPoster', 'shape', 'model', 'autoRotate', 'tilt', 'background', 'backgroundImage', 'backgroundVideo', 'tone',
])
</script>
