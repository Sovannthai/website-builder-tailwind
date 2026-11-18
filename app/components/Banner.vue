<template>
  <PbSection :tone="tone" space="none">
    <template #background>
      <div v-if="background === 'glow'" class="pointer-events-none absolute inset-0" aria-hidden="true">
        <div class="absolute -top-32 left-1/2 h-80 w-[720px] -translate-x-1/2 rounded-full bg-brand/20 blur-[110px]" />
      </div>
      <div
        v-else-if="background === 'grid'"
        class="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,color-mix(in_oklab,currentColor_8%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,currentColor_8%,transparent)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_25%,transparent_70%)]"
        aria-hidden="true"
      />
      <template v-else-if="background === 'image' && bgSrc">
        <img :src="bgSrc" alt="" class="absolute inset-0 h-full w-full object-cover" />
        <div class="absolute inset-0 bg-night/70" />
      </template>
    </template>

    <div :class="['py-16 sm:py-24', background === 'image' && bgSrc ? 'text-white' : '']">
      <nav v-if="breadcrumb" :class="['mb-6 flex items-center gap-2 text-fine text-current/55', align === 'center' ? 'justify-center' : '']" aria-label="Breadcrumb">
        <a :href="pbHref('/')" class="hover:text-current">{{ homeLabel }}</a>
        <i class="mdi mdi-chevron-right" />
        <span class="text-current/80">{{ breadcrumb }}</span>
      </nav>
      <PbHeading :eyebrow="eyebrow" :title="title" :subtitle="subtitle" :align="align" size="xl" level="h1" :on-brand="tone === 'brand'" />
    </div>
  </PbSection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PbSection from '~/components/PbSection.vue'
import PbHeading from '~/components/PbHeading.vue'
import { resolveImageSrc } from '~/utils/image'
import { pbHref } from '~/utils/pb'

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    title?: string
    subtitle?: string
    breadcrumb?: string
    homeLabel?: string
    align?: string
    background?: string
    backgroundImage?: string
    tone?: string
  }>(),
  {
    eyebrow: '',
    title: 'Page title',
    subtitle: '',
    breadcrumb: '',
    homeLabel: 'Home',
    align: 'center',
    background: 'glow',
    backgroundImage: '',
    tone: 'light',
  }
)

const bgSrc = computed(() => resolveImageSrc(props.backgroundImage))
</script>
