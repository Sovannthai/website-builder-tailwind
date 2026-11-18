<template>
  <PbSection :tone="tone" :space="space">
    <PbHeading :eyebrow="eyebrow" :title="title" :subtitle="subtitle" :align="align" :on-brand="tone === 'brand'" />

    <ul class="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 sm:mt-16 md:grid-cols-3 lg:grid-cols-4">
      <li v-for="(member, i) in members" :key="i" class="group">
        <div class="relative overflow-hidden rounded-card">
          <img
            v-if="member.photo"
            :src="resolveImageSrc(member.photo)"
            :alt="member.name"
            class="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
          <div v-else :class="['flex aspect-[4/5] items-center justify-center', placeholderClass(i)]">
            <span class="font-display text-5xl font-semibold opacity-80">{{ initials(member.name) }}</span>
          </div>
          <a
            v-if="member.link"
            :href="pbHref(member.link)"
            class="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink opacity-0 shadow-md transition group-hover:opacity-100"
            :aria-label="`${member.name} profile`"
          >
            <i class="mdi mdi-arrow-top-right text-lead leading-none" />
          </a>
        </div>
        <p class="mt-4 font-display text-lead font-semibold">{{ member.name }}</p>
        <p class="text-small text-current/60">{{ member.role }}</p>
      </li>
    </ul>
  </PbSection>
</template>

<script setup lang="ts">
import PbSection from '~/components/PbSection.vue'
import PbHeading from '~/components/PbHeading.vue'
import { resolveImageSrc } from '~/utils/image'
import { initials, pbHref } from '~/utils/pb'

withDefaults(
  defineProps<{
    eyebrow?: string
    title?: string
    subtitle?: string
    members?: Array<{ name: string; role?: string; photo?: string; link?: string }>
    align?: string
    tone?: string
    space?: 'sm' | 'md' | 'lg'
  }>(),
  { eyebrow: '', title: '', subtitle: '', members: () => [], align: 'left', tone: 'light', space: 'md' }
)

const PLACEHOLDERS = ['bg-brand/15 text-brand-text', 'bg-brand/25 text-brand-text', 'bg-brand/10 text-brand-text', 'bg-brand/20 text-brand-text']
const placeholderClass = (i: number) => PLACEHOLDERS[i % PLACEHOLDERS.length]
</script>
