<template>
  <PbSection :tone="tone" :space="space">
    <PbHeading
      v-if="title || eyebrow || subtitle"
      class="mb-12 sm:mb-16"
      :eyebrow="eyebrow"
      :title="title"
      :subtitle="subtitle"
      :align="align"
      :on-brand="tone === 'brand'"
    />

    <dl :class="['grid gap-px overflow-hidden', colsClass, variant === 'cards' ? 'gap-4 overflow-visible' : '']">
      <template v-if="loading">
        <div v-for="n in 4" :key="`sk-${n}`" class="h-28 animate-pulse rounded-card bg-current/5" />
      </template>
      <div
        v-for="(item, i) in rows"
        v-else
        :key="i"
        :class="[
          'flex flex-col',
          variant === 'cards' ? cardClass : 'px-2 py-2 sm:px-6',
          variant === 'divided' && i > 0 ? 'sm:border-l sm:border-current/10' : '',
          align === 'center' ? 'items-center text-center' : '',
        ]"
      >
        <dd class="order-1 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          <span :class="tone === 'brand' ? '' : 'text-brand-text'">{{ item.value }}</span>
        </dd>
        <dt class="order-2 mt-2 text-base font-semibold">{{ item.label }}</dt>
        <p v-if="item.description" class="order-3 mt-1 text-small text-current/60">{{ item.description }}</p>
      </div>
    </dl>
  </PbSection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PbSection from '~/components/PbSection.vue'
import PbHeading from '~/components/PbHeading.vue'
import { useCollection, pickWith, toFieldMap, FIELD_ALIASES } from '~/composables/useCollection'

interface StatItem {
  value: string
  label: string
  description?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    title?: string
    subtitle?: string
    items?: StatItem[]
    variant?: string
    align?: string
    tone?: string
    space?: 'sm' | 'md' | 'lg'
    apiCollection?: string
    apiLimit?: string | number
    apiSort?: string
    apiFields?: Array<{ key?: string; value?: string }>
  }>(),
  {
    eyebrow: '',
    title: '',
    subtitle: '',
    items: () => [],
    variant: 'divided',
    align: 'center',
    tone: 'light',
    space: 'md',
    apiCollection: '',
    apiLimit: 4,
    apiSort: '',
    apiFields: () => [],
  }
)

const fieldMap = computed(() => toFieldMap(props.apiFields))

const { items: rows, loading } = useCollection<StatItem>(() => props.apiCollection, {
  fallback: () => props.items,
  limit: () => props.apiLimit,
  sort: () => props.apiSort,
  map: (row) => ({
    value: pickWith(row, fieldMap.value.value, FIELD_ALIASES.value, '0'),
    label: pickWith(row, fieldMap.value.title, FIELD_ALIASES.title),
    description: pickWith(row, fieldMap.value.description, FIELD_ALIASES.description),
  }),
})

const colsClass = computed(() => {
  const n = rows.value.length || 4
  if (n <= 2) return 'grid-cols-1 sm:grid-cols-2'
  if (n === 3) return 'grid-cols-1 sm:grid-cols-3'
  return 'grid-cols-2 gap-y-10 lg:grid-cols-4'
})

const cardClass = computed(() => {
  if (props.tone === 'dark') return 'rounded-card border border-white/10 bg-white/[0.04] p-7'
  if (props.tone === 'brand') return 'rounded-card bg-current/[0.08] p-7'
  return 'rounded-card border border-slate-200/80 bg-white p-7 shadow-sm'
})
</script>
