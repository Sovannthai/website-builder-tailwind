<template>
  <footer :class="['pb-footer', toneClass]">
    <div class="mx-auto max-w-6xl px-5 pb-10 pt-16 sm:px-8 sm:pt-20">
      <div class="grid gap-12 lg:grid-cols-[1.3fr_2fr]">
        <div class="max-w-sm">
          <a :href="pbHref('/')" class="flex items-center gap-2.5">
            <img v-if="logoSrc" :src="logoSrc" :alt="brandName || 'Logo'" class="h-8 w-auto max-w-[140px] object-contain" />
            <span
              v-else
              class="flex h-8 w-8 items-center justify-center rounded-[calc(var(--radius-card)*0.6)] bg-brand font-display text-small font-bold text-brand-ink"
            >{{ initials(brandName) || 'W' }}</span>
            <span v-if="brandName" class="font-display text-lead font-semibold tracking-tight">{{ brandName }}</span>
          </a>
          <p v-if="description" class="mt-5 text-small text-current/65">{{ description }}</p>
          <div v-if="socials.length" class="mt-6 flex gap-2">
            <a
              v-for="(s, i) in socials"
              :key="i"
              :href="s.link || '#'"
              target="_blank"
              rel="noopener"
              class="flex h-9 w-9 items-center justify-center rounded-full border border-current/15 text-current/75 transition hover:border-current/40 hover:text-current"
              :aria-label="s.icon"
            >
              <i :class="[mdiClass(s.icon), 'text-lead leading-none']" />
            </a>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div v-for="(col, i) in columns" :key="i">
            <p class="text-small font-semibold">{{ col.title }}</p>
            <ul class="mt-4 flex flex-col gap-3">
              <li v-for="(link, j) in linkLines(col.links)" :key="j">
                <a :href="pbHref(link.href)" class="text-small text-current/65 transition hover:text-current">{{ link.label }}</a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="mt-14 flex flex-col gap-4 border-t border-current/10 pt-8 text-fine text-current/55 sm:flex-row sm:items-center sm:justify-between">
        <p>{{ copyrightText }}</p>
        <ul v-if="legalLinks.length" class="flex flex-wrap gap-x-6 gap-y-2">
          <li v-for="(link, i) in legalLinks" :key="i">
            <a :href="pbHref(link.href)" class="hover:text-current">{{ link.label }}</a>
          </li>
        </ul>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { resolveImageSrc } from '~/utils/image'
import { initials, linkLines, mdiClass, pbHref } from '~/utils/pb'

const props = withDefaults(
  defineProps<{
    logo?: string
    brandName?: string
    description?: string
    columns?: Array<{ title: string; links?: string }>
    socials?: Array<{ icon: string; link?: string }>
    legal?: string
    copyright?: string
    tone?: string
  }>(),
  {
    logo: '',
    brandName: '',
    description: '',
    columns: () => [],
    socials: () => [],
    legal: '',
    copyright: '© {year} Company. All rights reserved.',
    tone: 'muted',
  }
)

const logoSrc = computed(() => resolveImageSrc(props.logo))
const legalLinks = computed(() => linkLines(props.legal))
const copyrightText = computed(() => (props.copyright || '').replace(/\{year\}/g, String(new Date().getFullYear())))

const toneClass = computed(
  () =>
    ({
      light: 'bg-white text-ink border-t border-slate-200',
      muted: 'bg-slate-50 text-ink border-t border-slate-200/70',
      dark: 'bg-night text-white',
      brand: 'bg-brand text-brand-ink',
    })[props.tone] ?? 'bg-slate-50 text-ink'
)
</script>
