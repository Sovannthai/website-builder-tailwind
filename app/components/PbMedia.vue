<template>
  <div :class="['pb-media relative overflow-hidden rounded-card', aspectClass]">
    <img v-if="src" :src="src" :alt="alt" class="h-full w-full object-cover" :loading="eager ? 'eager' : 'lazy'" />
    <!-- No image yet: a tasteful accent-coloured placeholder instead of a broken box -->
    <div v-else class="absolute inset-0 bg-brand/10">
      <div class="absolute -left-1/4 -top-1/3 h-[80%] w-[80%] rounded-full bg-brand/30 blur-3xl" />
      <div class="absolute -bottom-1/3 -right-1/4 h-[70%] w-[70%] rounded-full bg-brand/20 blur-3xl" />
      <div
        class="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(to_right,rgb(15_23_42/0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgb(15_23_42/0.08)_1px,transparent_1px)] [background-size:32px_32px]"
      />
      <i v-if="icon" :class="[mdiClass(icon), 'absolute inset-0 flex items-center justify-center text-6xl text-brand-text/70']" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { resolveImageSrc } from '~/utils/image'
import { mdiClass } from '~/utils/pb'

const props = withDefaults(
  defineProps<{ image?: string; alt?: string; aspect?: string; icon?: string; eager?: boolean }>(),
  { image: '', alt: '', aspect: '4/3', icon: '', eager: false }
)

const src = computed(() => resolveImageSrc(props.image))
const aspectClass = computed(
  () =>
    ({ '1/1': 'aspect-square', '4/3': 'aspect-[4/3]', '3/4': 'aspect-[3/4]', '16/9': 'aspect-video', '16/10': 'aspect-[16/10]', fill: 'h-full min-h-64' })[
      props.aspect
    ] ?? 'aspect-[4/3]'
)
</script>
