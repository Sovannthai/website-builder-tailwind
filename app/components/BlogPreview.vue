<template>
  <PbSection :tone="tone" :space="space">
    <div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <PbHeading :eyebrow="eyebrow" :title="title" :subtitle="subtitle" :on-brand="tone === 'brand'" />
      <PbButton :label="buttonLabel" :href="buttonLink" variant="secondary" :tone="tone" class="shrink-0" />
    </div>

    <div class="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      <template v-if="loading">
        <div v-for="n in 3" :key="`sk-${n}`" class="aspect-[4/3] animate-pulse rounded-card bg-current/5" />
      </template>
      <a v-for="(post, i) in rows" v-else :key="i" :href="pbHref(post.link)" class="group flex flex-col">
        <PbMedia :image="post.image" aspect="16/10" icon="text-box-outline" class="transition duration-300 group-hover:opacity-90" />
        <div class="mt-5 flex items-center gap-3 text-fine text-current/60">
          <span v-if="post.category" :class="['rounded-full px-2.5 py-0.5 font-semibold', tone === 'brand' ? 'bg-current/15' : 'bg-brand/10 text-brand-text']">{{ post.category }}</span>
          <span v-if="post.date">{{ post.date }}</span>
        </div>
        <h3 class="mt-3 font-display text-big font-semibold leading-snug tracking-tight group-hover:underline group-hover:decoration-current/30 group-hover:underline-offset-4">
          {{ post.title }}
        </h3>
        <p v-if="post.excerpt" class="mt-2 line-clamp-2 text-small text-current/65">{{ post.excerpt }}</p>
      </a>
    </div>
    <p v-if="error" class="mt-4 text-fine text-error">{{ error }}</p>
  </PbSection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PbSection from '~/components/PbSection.vue'
import PbHeading from '~/components/PbHeading.vue'
import PbButton from '~/components/PbButton.vue'
import PbMedia from '~/components/PbMedia.vue'
import { pbHref } from '~/utils/pb'
import { useCollection, pickWith, toFieldMap, FIELD_ALIASES } from '~/composables/useCollection'

interface Post {
  image?: string
  title: string
  excerpt?: string
  category?: string
  date?: string
  link?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    title?: string
    subtitle?: string
    posts?: Post[]
    buttonLabel?: string
    buttonLink?: string
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
    posts: () => [],
    buttonLabel: '',
    buttonLink: '#',
    tone: 'light',
    space: 'md',
    apiCollection: '',
    apiLimit: 3,
    apiSort: '-date_created',
    apiFields: () => [],
  }
)

const fieldMap = computed(() => toFieldMap(props.apiFields))

/** Show API dates as "Mar 4, 2026"; leave anything unparseable as typed. */
function formatDate(value: string) {
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const { items: rows, loading, error } = useCollection<Post>(() => props.apiCollection, {
  fallback: () => props.posts,
  limit: () => props.apiLimit,
  sort: () => props.apiSort,
  map: (row) => ({
    title: pickWith(row, fieldMap.value.title, FIELD_ALIASES.title, 'Untitled'),
    excerpt: pickWith(row, fieldMap.value.description, FIELD_ALIASES.description),
    image: pickWith(row, fieldMap.value.image, FIELD_ALIASES.image),
    category: pickWith(row, fieldMap.value.category, ['category', 'tag', 'topic']),
    date: formatDate(pickWith(row, fieldMap.value.date, ['date', 'published_at', 'date_created'])),
    link: pickWith(row, fieldMap.value.path, FIELD_ALIASES.path),
  }),
})
</script>
