<template>
  <PbSection :tone="tone" :space="space">
    <PbHeading
      v-if="title || eyebrow || subtitle"
      class="mb-12"
      :eyebrow="eyebrow"
      :title="title"
      :subtitle="subtitle"
      :align="align"
      :on-brand="tone === 'brand'"
    />
    <div v-if="layout === 'masonry'" class="columns-2 gap-4 md:columns-3 [&>*]:mb-4">
      <figure v-for="(item, i) in rows" :key="i" class="group relative break-inside-avoid overflow-hidden rounded-card">
        <img v-if="item.image" :src="resolveImageSrc(item.image)" :alt="item.caption" class="w-full transition duration-500 group-hover:scale-[1.03]" loading="lazy" />
        <PbMedia v-else :aspect="i % 3 === 0 ? '3/4' : '4/3'" icon="image-outline" />
        <figcaption v-if="item.caption" class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10 text-small font-medium text-white opacity-0 transition group-hover:opacity-100">
          {{ item.caption }}
        </figcaption>
      </figure>
    </div>
    <div v-else class="grid grid-cols-2 gap-4 md:grid-cols-4 md:auto-rows-[220px]">
      <figure
        v-for="(item, i) in rows"
        :key="i"
        :class="['group relative overflow-hidden rounded-card', i % 5 === 0 ? 'col-span-2 row-span-2 aspect-square md:aspect-auto' : 'aspect-square md:aspect-auto']"
      >
        <img v-if="item.image" :src="resolveImageSrc(item.image)" :alt="item.caption" class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" loading="lazy" />
        <PbMedia v-else aspect="fill" class="!h-full !min-h-0" icon="image-outline" />
        <figcaption v-if="item.caption" class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10 text-small font-medium text-white opacity-0 transition group-hover:opacity-100">
          {{ item.caption }}
        </figcaption>
      </figure>
    </div>
  </PbSection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PbSection from '~/components/PbSection.vue'
import PbHeading from '~/components/PbHeading.vue'
import PbMedia from '~/components/PbMedia.vue'
import { resolveImageSrc } from '~/utils/image'
import { useCollection, pickWith, toFieldMap, FIELD_ALIASES } from '~/composables/useCollection'

interface GalleryItem {
  image?: string
  caption?: string
}

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    title?: string
    subtitle?: string
    images?: GalleryItem[]
    layout?: string
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
    images: () => [],
    layout: 'grid',
    align: 'center',
    tone: 'light',
    space: 'md',
    apiCollection: '',
    apiLimit: 9,
    apiSort: '',
    apiFields: () => [],
  }
)

const fieldMap = computed(() => toFieldMap(props.apiFields))

const { items: rows } = useCollection<GalleryItem>(() => props.apiCollection, {
  fallback: () => props.images,
  limit: () => props.apiLimit,
  sort: () => props.apiSort,
  // Accept bare URL strings as well as objects
  map: (row) =>
    typeof row === 'string'
      ? { image: row }
      : {
          image: pickWith(row, fieldMap.value.image, FIELD_ALIASES.image),
          caption: pickWith(row, fieldMap.value.title, FIELD_ALIASES.title),
        },
})
</script>
