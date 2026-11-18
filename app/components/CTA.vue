<template>
  <PbSection :tone="variant === 'card' ? 'light' : tone" :space="space">
    <div
      :class="[
        'relative overflow-hidden',
        variant === 'card' ? ['rounded-[calc(var(--radius-card)*1.5)] px-6 py-16 sm:px-16 sm:py-20', cardToneClass] : '',
      ]"
      :style="variant === 'card' && tone === 'dark' ? { '--pb-brand-text': 'var(--pb-accent-soft, var(--pb-accent))' } : undefined"
    >
      <div v-if="variant === 'card'" class="pointer-events-none absolute inset-0" aria-hidden="true">
        <div class="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
        <div class="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-black/10 blur-3xl" />
      </div>
      <div :class="['relative flex flex-col gap-8', align === 'center' ? 'items-center text-center' : 'lg:flex-row lg:items-end lg:justify-between']">
        <PbHeading :eyebrow="eyebrow" :title="title" :subtitle="subtitle" :align="align" :on-brand="effectiveTone === 'brand'" />
        <div class="flex shrink-0 flex-col gap-3 sm:flex-row">
          <PbButton :label="primaryLabel" :href="primaryLink" :tone="effectiveTone" class="!px-7 !py-3.5" />
          <PbButton :label="secondaryLabel" :href="secondaryLink" variant="secondary" :tone="effectiveTone" class="!px-7 !py-3.5" />
        </div>
      </div>
    </div>
  </PbSection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PbSection from '~/components/PbSection.vue'
import PbHeading from '~/components/PbHeading.vue'
import PbButton from '~/components/PbButton.vue'

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    title?: string
    subtitle?: string
    primaryLabel?: string
    primaryLink?: string
    secondaryLabel?: string
    secondaryLink?: string
    variant?: string
    align?: string
    tone?: string
    space?: 'sm' | 'md' | 'lg'
  }>(),
  {
    eyebrow: '',
    title: 'Ready to get *started*?',
    subtitle: '',
    primaryLabel: 'Get started',
    primaryLink: '#',
    secondaryLabel: '',
    secondaryLink: '#',
    variant: 'card',
    align: 'center',
    tone: 'brand',
    space: 'md',
  }
)

/** Card style paints its own panel in the chosen tone on a light section. */
const cardToneClass = computed(
  () =>
    ({ brand: 'bg-brand text-brand-ink', dark: 'bg-night text-white', muted: 'bg-slate-100 text-ink', light: 'bg-slate-50 text-ink ring-1 ring-slate-200' })[
      props.tone
    ] ?? 'bg-brand text-brand-ink'
)
const effectiveTone = computed(() => props.tone)
</script>
