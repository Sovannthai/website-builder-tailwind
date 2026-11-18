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

    <!-- Spotlight: one big quote -->
    <figure v-if="layout === 'spotlight' && rows[0]" class="mx-auto max-w-4xl text-center">
      <i class="mdi mdi-format-quote-open text-6xl leading-none text-brand-text" :class="tone === 'brand' ? '!text-current/50' : ''" />
      <blockquote class="mt-4 font-display text-2xl font-medium leading-snug tracking-tight text-balance sm:text-4xl">
        {{ rows[0].quote }}
      </blockquote>
      <figcaption class="mt-10 flex items-center justify-center gap-4">
        <Avatar :item="rows[0]" size="lg" />
        <div class="text-left">
          <p class="font-semibold">{{ rows[0].name }}</p>
          <p class="text-small text-current/60">{{ rows[0].role }}</p>
        </div>
      </figcaption>
    </figure>

    <!-- Grid / masonry of cards -->
    <div v-else class="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
      <figure v-for="(item, i) in rows" :key="i" :class="['break-inside-avoid', cardClass]">
        <div v-if="truthy(showRating)" class="mb-4 flex gap-0.5 text-amber-400">
          <i v-for="n in 5" :key="n" class="mdi mdi-star text-lead leading-none" />
        </div>
        <blockquote class="text-base leading-relaxed text-current/85">“{{ item.quote }}”</blockquote>
        <figcaption class="mt-6 flex items-center gap-3">
          <Avatar :item="item" />
          <div>
            <p class="text-small font-semibold">{{ item.name }}</p>
            <p class="text-fine text-current/60">{{ item.role }}</p>
          </div>
        </figcaption>
      </figure>
    </div>
  </PbSection>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from 'vue'
import PbSection from '~/components/PbSection.vue'
import PbHeading from '~/components/PbHeading.vue'
import { resolveImageSrc } from '~/utils/image'
import { truthy, initials } from '~/utils/pb'
import { useCollection, pickWith, toFieldMap, FIELD_ALIASES } from '~/composables/useCollection'

interface Testimonial {
  quote: string
  name: string
  role?: string
  avatar?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    title?: string
    subtitle?: string
    items?: Testimonial[]
    layout?: string
    showRating?: boolean | string
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
    layout: 'grid',
    showRating: false,
    align: 'center',
    tone: 'light',
    space: 'md',
    apiCollection: '',
    apiLimit: 6,
    apiSort: '',
    apiFields: () => [],
  }
)

const fieldMap = computed(() => toFieldMap(props.apiFields))

const { items: rows } = useCollection<Testimonial>(() => props.apiCollection, {
  fallback: () => props.items,
  limit: () => props.apiLimit,
  sort: () => props.apiSort,
  map: (row) => ({
    quote: pickWith(row, fieldMap.value.message, FIELD_ALIASES.message),
    name: pickWith(row, fieldMap.value.title, FIELD_ALIASES.title, 'Anonymous'),
    role: pickWith(row, fieldMap.value.role, FIELD_ALIASES.role),
    avatar: pickWith(row, fieldMap.value.image, FIELD_ALIASES.image),
  }),
})

const cardClass = computed(() => {
  if (props.tone === 'dark') return 'rounded-card border border-white/10 bg-white/[0.04] p-7'
  if (props.tone === 'brand') return 'rounded-card bg-current/[0.08] p-7'
  return 'rounded-card border border-slate-200/80 bg-white p-7 shadow-sm'
})

/** Photo, or initials on an accent-tinted circle. */
const Avatar = defineComponent({
  props: { item: { type: Object, required: true }, size: { type: String, default: 'md' } },
  setup(p) {
    return () => {
      const cls = p.size === 'lg' ? 'h-14 w-14 text-lead' : 'h-10 w-10 text-small'
      const src = resolveImageSrc((p.item as Testimonial).avatar)
      return src
        ? h('img', { src, alt: (p.item as Testimonial).name, class: `${cls} shrink-0 rounded-full object-cover` })
        : h('span', { class: `${cls} flex shrink-0 items-center justify-center rounded-full bg-brand/15 font-semibold text-brand-text` }, initials((p.item as Testimonial).name))
    }
  },
})
</script>
