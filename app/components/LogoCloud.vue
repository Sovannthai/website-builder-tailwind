<template>
  <PbSection :tone="tone" :space="space">
    <p v-if="title" class="mb-8 text-center text-small font-medium text-current/60">{{ title }}</p>
    <ul class="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 sm:gap-x-14">
      <li v-for="(logo, i) in logos" :key="i" class="flex items-center opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0">
        <img v-if="logo.image" :src="resolveImageSrc(logo.image)" :alt="logo.name" class="h-7 w-auto max-w-[140px] object-contain sm:h-8" />
        <span v-else class="flex items-center gap-2 font-display text-big font-semibold tracking-tight">
          <i v-if="logo.icon" :class="[mdiClass(logo.icon), 'text-2xl leading-none']" />{{ logo.name }}
        </span>
      </li>
    </ul>
  </PbSection>
</template>

<script setup lang="ts">
import PbSection from '~/components/PbSection.vue'
import { resolveImageSrc } from '~/utils/image'
import { mdiClass } from '~/utils/pb'

withDefaults(
  defineProps<{
    title?: string
    logos?: Array<{ name?: string; image?: string; icon?: string }>
    tone?: string
    space?: 'sm' | 'md' | 'lg'
  }>(),
  { title: '', logos: () => [], tone: 'light', space: 'sm' }
)
</script>
