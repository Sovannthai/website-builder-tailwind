<template>
  <TeamView v-bind="props" />
</template>

<script setup lang="ts">
import TeamView from '~/components/Team.vue'

defineOptions({ label: "Team", emoji: "👥" })

// Untyped on purpose (see app_header/AppHeader.vue). Keep in sync with fields.ts.
const props = defineProps(['eyebrow', 'title', 'subtitle', 'members', 'align', 'tone', 'space'])
</script>
