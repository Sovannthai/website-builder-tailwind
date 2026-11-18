<template>
  <section
    :id="anchor || undefined"
    :class="['pb-section relative overflow-hidden', toneClass, spaceClass]"
    :style="toneStyle"
    :data-tone="tone"
  >
    <slot name="background" />
    <div :class="['relative mx-auto px-5 sm:px-8', widthClass]">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

/**
 * Shared wrapper for the modern blocks: section background tone, vertical
 * rhythm and a centred content column. It also sets --pb-brand-text so
 * `text-brand-text` stays readable on the section's background.
 */
const props = withDefaults(
  defineProps<{
    tone?: string
    space?: 'none' | 'sm' | 'md' | 'lg'
    width?: 'narrow' | 'normal' | 'wide'
    anchor?: string
  }>(),
  { tone: 'light', space: 'md', width: 'normal', anchor: '' }
)

const toneClass = computed(
  () =>
    ({
      light: 'bg-white text-ink',
      muted: 'bg-slate-50 text-ink',
      dark: 'bg-night text-white',
      brand: 'bg-brand text-brand-ink',
    })[props.tone] ?? 'bg-white text-ink'
)

/**
 * Accent colour for text/icons in this section: the bright accent on dark
 * backgrounds it's the layout's "soft" shade (lightened when the accent is
 * dark), on light ones the "strong" shade (darkened when the accent is light,
 * e.g. lime). Either way, highlighted words and icons stay readable.
 */
const toneStyle = computed(() =>
  props.tone === 'dark'
    ? { '--pb-brand-text': 'var(--pb-accent-soft, var(--pb-accent))' }
    : { '--pb-brand-text': 'var(--pb-accent-strong, var(--pb-accent))' }
)

const spaceClass = computed(
  () =>
    ({
      none: '',
      sm: 'py-10 sm:py-12',
      md: 'py-16 sm:py-24',
      lg: 'py-20 sm:py-32',
    })[props.space]
)

const widthClass = computed(
  () => ({ narrow: 'max-w-3xl', normal: 'max-w-6xl', wide: 'max-w-7xl' })[props.width]
)
</script>
