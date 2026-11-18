<template>
  <PbSection :tone="tone" :space="space" :anchor="anchor">
    <PbHeading :eyebrow="eyebrow" :title="title" :subtitle="subtitle" :align="align" :on-brand="tone === 'brand'" />

    <div :class="['mt-12 sm:mt-16', gridClass]">
      <template v-if="loading">
        <div v-for="n in 3" :key="`sk-${n}`" class="h-56 animate-pulse rounded-card bg-current/5" />
      </template>

      <template v-else>
        <article
          v-for="(item, i) in rows"
          :key="i"
          :class="[
            'group relative flex flex-col',
            layout === 'list' ? 'flex-row gap-5' : cardClass,
            layout === 'bento' ? bentoClass(i) : '',
          ]"
        >
          <PbMedia
            v-if="layout === 'bento' && i === 0"
            class="mb-6 -mx-2 -mt-2"
            :image="item.image"
            aspect="16/9"
            :icon="item.icon || 'chart-box-outline'"
          />
          <span
            v-else-if="item.image && layout !== 'list'"
            class="mb-5 block overflow-hidden rounded-[calc(var(--radius-card)*0.75)]"
          >
            <img :src="resolveImageSrc(item.image)" :alt="item.title" class="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.03]" loading="lazy" />
          </span>
          <span
            v-else-if="item.icon"
            :class="[
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-[calc(var(--radius-card)*0.6)]',
              tone === 'brand' ? 'bg-current/15' : 'bg-brand/10 text-brand-text',
              layout === 'list' ? '' : 'mb-5',
            ]"
          >
            <i :class="[mdiClass(item.icon), 'text-[22px] leading-none']" />
          </span>

          <div class="flex flex-1 flex-col">
            <h3 class="font-display text-lead font-semibold tracking-tight">{{ item.title }}</h3>
            <p v-if="item.description" class="mt-2 text-small text-current/65">{{ item.description }}</p>
            <a
              v-if="item.link"
              :href="pbHref(item.link)"
              class="mt-4 inline-flex items-center gap-1 text-small font-semibold"
              :class="tone === 'brand' ? '' : 'text-brand-text'"
            >
              {{ linkLabel }} <i class="mdi mdi-arrow-right transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </article>
      </template>
    </div>

    <p v-if="error" class="mt-4 text-fine text-error">{{ error }}</p>
  </PbSection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PbSection from '~/components/PbSection.vue'
import PbHeading from '~/components/PbHeading.vue'
import PbMedia from '~/components/PbMedia.vue'
import { resolveImageSrc } from '~/utils/image'
import { mdiClass, pbHref } from '~/utils/pb'
import { useCollection, pickWith, toFieldMap, FIELD_ALIASES } from '~/composables/useCollection'

interface FeatureItem {
  icon?: string
  image?: string
  title: string
  description?: string
  link?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    title?: string
    subtitle?: string
    items?: FeatureItem[]
    linkLabel?: string
    layout?: string
    columns?: string
    align?: string
    tone?: string
    space?: 'sm' | 'md' | 'lg'
    anchor?: string
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
    linkLabel: 'Learn more',
    layout: 'cards',
    columns: '3',
    align: 'center',
    tone: 'light',
    space: 'md',
    anchor: '',
    apiCollection: '',
    apiLimit: 6,
    apiSort: '',
    apiFields: () => [],
  }
)

const fieldMap = computed(() => toFieldMap(props.apiFields))

const { items: rows, loading, error } = useCollection<FeatureItem>(() => props.apiCollection, {
  fallback: () => props.items,
  limit: () => props.apiLimit,
  sort: () => props.apiSort,
  map: (row) => ({
    title: pickWith(row, fieldMap.value.title, FIELD_ALIASES.title, 'Untitled'),
    description: pickWith(row, fieldMap.value.description, FIELD_ALIASES.description),
    image: pickWith(row, fieldMap.value.image, FIELD_ALIASES.image),
    link: pickWith(row, fieldMap.value.path, FIELD_ALIASES.path),
  }),
})

const COLS: Record<string, string> = {
  '2': 'sm:grid-cols-2',
  '3': 'sm:grid-cols-2 lg:grid-cols-3',
  '4': 'sm:grid-cols-2 lg:grid-cols-4',
}

const gridClass = computed(() => {
  if (props.layout === 'bento') return 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:auto-rows-fr'
  if (props.layout === 'list') return 'grid gap-x-12 gap-y-10 sm:grid-cols-2'
  return `grid gap-5 ${COLS[props.columns] ?? COLS['3']}`
})

const cardClass = computed(() => {
  if (props.tone === 'dark') return 'rounded-card border border-white/10 bg-white/[0.04] p-7 transition hover:bg-white/[0.07]'
  if (props.tone === 'brand') return 'rounded-card bg-current/[0.08] p-7'
  if (props.tone === 'muted') return 'rounded-card border border-slate-200/80 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5'
  return 'rounded-card border border-slate-200/80 bg-white p-7 transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-900/5'
})

/** Bento: first tile is big, the 4th spans two columns, the rest are single. */
const bentoClass = (i: number) => {
  if (i === 0) return 'lg:col-span-2 lg:row-span-2'
  if (i === 3) return 'lg:col-span-2'
  return ''
}
</script>
