<template>
  <PbSection :tone="tone" :space="space" :anchor="anchor">
    <PbHeading :eyebrow="eyebrow" :title="title" :subtitle="subtitle" align="center" :on-brand="tone === 'brand'" />

    <div :class="['mx-auto mt-12 grid items-stretch gap-5 sm:mt-16', colsClass]">
      <article
        v-for="(plan, i) in plans"
        :key="i"
        :class="[
          'relative flex flex-col rounded-card p-7 sm:p-8',
          truthy(plan.highlighted) ? highlightClass : cardClass,
        ]"
      >
        <span
          v-if="plan.badge"
          class="absolute -top-3 left-7 rounded-full bg-brand px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-ink shadow-md"
          :class="truthy(plan.highlighted) && tone !== 'brand' ? '!bg-white !text-ink' : ''"
        >{{ plan.badge }}</span>

        <h3 class="font-display text-lead font-semibold">{{ plan.name }}</h3>
        <p v-if="plan.description" class="mt-2 text-small opacity-70">{{ plan.description }}</p>

        <p class="mt-6 flex items-baseline gap-1.5">
          <span class="font-display text-5xl font-semibold tracking-tight">{{ plan.price }}</span>
          <span v-if="plan.period" class="text-small opacity-60">{{ plan.period }}</span>
        </p>

        <a
          v-if="plan.ctaLabel"
          :href="pbHref(plan.ctaLink)"
          :class="[
            'mt-7 inline-flex justify-center rounded-btn px-5 py-3 text-small font-semibold transition',
            truthy(plan.highlighted)
              ? 'bg-white text-ink hover:bg-white/90'
              : tone === 'dark'
                ? 'bg-white/10 text-white hover:bg-white/15'
                : 'bg-brand text-brand-ink hover:opacity-90',
          ]"
        >{{ plan.ctaLabel }}</a>

        <ul class="mt-8 flex flex-col gap-3 border-t border-current/10 pt-7">
          <li v-for="(feature, j) in lines(plan.features)" :key="j" class="flex items-start gap-3 text-small">
            <i
              :class="[
                'mdi mdi-check-circle mt-0.5 text-base leading-none',
                truthy(plan.highlighted) || tone === 'brand' ? 'opacity-80' : 'text-brand-text',
              ]"
            />
            <span class="opacity-85">{{ feature }}</span>
          </li>
        </ul>
      </article>
    </div>

    <p v-if="note" class="mt-10 text-center text-small text-current/60">{{ note }}</p>
  </PbSection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PbSection from '~/components/PbSection.vue'
import PbHeading from '~/components/PbHeading.vue'
import { lines, pbHref, truthy } from '~/utils/pb'

interface Plan {
  name: string
  price: string
  period?: string
  description?: string
  features?: string
  ctaLabel?: string
  ctaLink?: string
  highlighted?: boolean | string
  badge?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    title?: string
    subtitle?: string
    plans?: Plan[]
    note?: string
    tone?: string
    space?: 'sm' | 'md' | 'lg'
    anchor?: string
  }>(),
  { eyebrow: '', title: '', subtitle: '', plans: () => [], note: '', tone: 'light', space: 'md', anchor: '' }
)

const colsClass = computed(() => {
  const n = props.plans.length
  if (n <= 1) return 'max-w-md'
  if (n === 2) return 'max-w-4xl md:grid-cols-2'
  if (n === 3) return 'max-w-6xl md:grid-cols-3'
  return 'max-w-7xl sm:grid-cols-2 lg:grid-cols-4'
})

const cardClass = computed(() => {
  if (props.tone === 'dark') return 'border border-white/10 bg-white/[0.04]'
  if (props.tone === 'brand') return 'bg-current/[0.08]'
  return 'border border-slate-200/80 bg-white shadow-sm'
})

const highlightClass = computed(() =>
  props.tone === 'brand'
    ? 'bg-night text-white shadow-2xl ring-1 ring-white/10 md:-my-4 md:py-12'
    : 'bg-brand text-brand-ink shadow-2xl shadow-brand/30 md:-my-4 md:py-12'
)
</script>
