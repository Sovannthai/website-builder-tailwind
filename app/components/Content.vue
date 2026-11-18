<template>
  <PbSection :tone="tone" :space="space" :anchor="anchor">
    <div class="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <div :class="mediaSide === 'left' ? 'lg:order-2' : ''">
        <PbHeading :eyebrow="eyebrow" :title="title" :on-brand="tone === 'brand'" />
        <p v-if="body" class="mt-5 whitespace-pre-line text-lead text-current/70">{{ body }}</p>

        <ul v-if="points.length" class="mt-8 flex flex-col gap-3.5">
          <li v-for="(point, i) in points" :key="i" class="flex items-start gap-3 text-base">
            <span
              :class="[
                'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                tone === 'brand' ? 'bg-current/15' : 'bg-brand/10 text-brand-text',
              ]"
            >
              <i class="mdi mdi-check text-small leading-none" />
            </span>
            <span class="text-current/85">{{ point }}</span>
          </li>
        </ul>

        <div v-if="buttonLabel || linkLabel" class="mt-9 flex flex-wrap items-center gap-5">
          <PbButton :label="buttonLabel" :href="buttonLink" :tone="tone" />
          <PbButton :label="linkLabel" :href="linkLink" variant="link" :tone="tone" />
        </div>
      </div>

      <div :class="['relative', mediaSide === 'left' ? 'lg:order-1' : '']">
        <div class="absolute -inset-6 -z-0 rounded-[calc(var(--radius-card)*1.5)] bg-brand/10 blur-2xl" aria-hidden="true" />
        <PbMockup v-if="visual === 'mockup'" class="relative" :stats="mockupStats" />
        <PbMedia v-else class="relative" :image="image" :aspect="aspect" icon="image-outline" />
      </div>
    </div>
  </PbSection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PbSection from '~/components/PbSection.vue'
import PbHeading from '~/components/PbHeading.vue'
import PbButton from '~/components/PbButton.vue'
import PbMedia from '~/components/PbMedia.vue'
import PbMockup from '~/components/PbMockup.vue'
import { lines, type MockupStat } from '~/utils/pb'

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    title?: string
    body?: string
    bullets?: string
    buttonLabel?: string
    buttonLink?: string
    linkLabel?: string
    linkLink?: string
    visual?: string
    mockupStats?: MockupStat[]
    image?: string
    aspect?: string
    mediaSide?: string
    tone?: string
    space?: 'sm' | 'md' | 'lg'
    anchor?: string
  }>(),
  {
    eyebrow: '',
    title: '',
    body: '',
    bullets: '',
    buttonLabel: '',
    buttonLink: '#',
    linkLabel: '',
    linkLink: '#',
    visual: 'image',
    image: '',
    aspect: '4/3',
    mediaSide: 'right',
    tone: 'light',
    space: 'md',
    anchor: '',
  }
)

const points = computed(() => lines(props.bullets))
</script>
