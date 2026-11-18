<template>
  <PbSection :tone="tone" :space="space" :anchor="anchor">
    <div :class="layout === 'split' ? 'grid gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-20' : 'mx-auto max-w-3xl'">
      <div :class="layout === 'split' ? 'lg:sticky lg:top-28 lg:self-start' : 'mb-12'">
        <PbHeading :eyebrow="eyebrow" :title="title" :subtitle="subtitle" :align="layout === 'split' ? 'left' : 'center'" :on-brand="tone === 'brand'" />
        <div v-if="contactLabel" :class="['mt-8', layout === 'split' ? '' : 'flex justify-center']">
          <PbButton :label="contactLabel" :href="contactLink" variant="secondary" :tone="tone" />
        </div>
      </div>

      <div class="divide-y divide-current/10 border-y border-current/10">
        <details v-for="(item, i) in items" :key="i" class="group py-1" :open="i === 0 && truthy(openFirst)">
          <summary class="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-left font-display text-lead font-medium [&::-webkit-details-marker]:hidden">
            {{ item.question }}
            <span
              :class="[
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-open:rotate-45',
                tone === 'brand' ? 'bg-current/15' : 'bg-brand/10 text-brand-text',
              ]"
            >
              <i class="mdi mdi-plus text-lead leading-none" />
            </span>
          </summary>
          <p class="whitespace-pre-line pb-6 pr-12 text-base text-current/70">{{ item.answer }}</p>
        </details>
      </div>
    </div>
  </PbSection>
</template>

<script setup lang="ts">
import PbSection from '~/components/PbSection.vue'
import PbHeading from '~/components/PbHeading.vue'
import PbButton from '~/components/PbButton.vue'
import { truthy } from '~/utils/pb'

withDefaults(
  defineProps<{
    eyebrow?: string
    title?: string
    subtitle?: string
    items?: Array<{ question: string; answer: string }>
    contactLabel?: string
    contactLink?: string
    layout?: string
    openFirst?: boolean | string
    tone?: string
    space?: 'sm' | 'md' | 'lg'
    anchor?: string
  }>(),
  {
    eyebrow: '',
    title: '',
    subtitle: '',
    items: () => [],
    contactLabel: '',
    contactLink: '#',
    layout: 'split',
    openFirst: true,
    tone: 'light',
    space: 'md',
    anchor: '',
  }
)
</script>
