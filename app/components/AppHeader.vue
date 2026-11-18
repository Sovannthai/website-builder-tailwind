<template>
  <header
    :class="[
      'pb-header z-50 w-full transition-colors',
      truthy(sticky) ? 'sticky top-0' : 'relative',
      styleClass,
    ]"
  >
    <div class="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 sm:h-[72px] sm:px-8">
      <!-- Brand -->
      <a :href="pbHref('/')" class="flex shrink-0 items-center gap-2.5">
        <img v-if="logoSrc" :src="logoSrc" :alt="brandName || 'Logo'" class="h-8 w-auto max-w-[140px] object-contain" />
        <span
          v-else
          class="flex h-8 w-8 items-center justify-center rounded-[calc(var(--radius-card)*0.6)] bg-brand font-display text-small font-bold text-brand-ink"
        >{{ initials(brandName) || 'W' }}</span>
        <span v-if="brandName" class="font-display text-lead font-semibold tracking-tight">{{ brandName }}</span>
      </a>

      <!-- Desktop nav -->
      <nav class="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label="Main">
        <div v-for="(item, i) in menuItems" :key="i" class="group relative">
          <a
            :href="pbHref(item.path)"
            class="inline-flex items-center gap-1 rounded-btn px-3.5 py-2 text-small font-medium text-current/75 transition-colors hover:bg-current/5 hover:text-current"
          >
            {{ item.title }}
            <i v-if="item.children?.length" class="mdi mdi-chevron-down text-base leading-none opacity-60" />
          </a>
          <div
            v-if="item.children?.length"
            class="invisible absolute left-1/2 top-full z-10 w-56 -translate-x-1/2 pt-2 opacity-0 transition-all group-hover:visible group-hover:opacity-100"
          >
            <div class="rounded-card border border-slate-200 bg-white p-2 text-ink shadow-xl shadow-slate-900/10">
              <a
                v-for="(child, j) in item.children"
                :key="j"
                :href="pbHref(child.path)"
                class="block rounded-[calc(var(--radius-card)*0.6)] px-3 py-2 text-small text-slate-600 hover:bg-slate-50 hover:text-ink"
              >{{ child.title }}</a>
            </div>
          </div>
        </div>
      </nav>

      <div class="ml-auto flex items-center gap-2 lg:ml-0">
        <a
          v-if="secondaryLabel"
          :href="pbHref(secondaryLink)"
          class="hidden px-3 py-2 text-small font-medium text-current/75 hover:text-current sm:inline-flex"
        >{{ secondaryLabel }}</a>
        <!-- Wrapped: PbButton's own inline-flex would override a `hidden` class on it -->
        <span v-if="ctaLabel" class="hidden sm:inline-flex">
          <PbButton class="!py-2.5" :label="ctaLabel" :href="ctaLink" :tone="variant === 'dark' ? 'dark' : 'light'" />
        </span>
        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-btn hover:bg-current/5 lg:hidden"
          :aria-expanded="open"
          aria-label="Toggle menu"
          @click="open = !open"
        >
          <i :class="['mdi text-2xl leading-none', open ? 'mdi-close' : 'mdi-menu']" />
        </button>
      </div>
    </div>

    <!-- Mobile panel -->
    <div v-if="open" class="border-t border-current/10 lg:hidden">
      <nav class="mx-auto flex max-w-6xl flex-col px-5 py-3 sm:px-8" aria-label="Mobile">
        <template v-for="(item, i) in menuItems" :key="i">
          <a :href="pbHref(item.path)" class="rounded-btn px-3 py-3 text-base font-medium hover:bg-current/5">{{ item.title }}</a>
          <a
            v-for="(child, j) in item.children || []"
            :key="`${i}-${j}`"
            :href="pbHref(child.path)"
            class="rounded-btn py-2 pl-7 pr-3 text-small text-current/70 hover:bg-current/5"
          >{{ child.title }}</a>
        </template>
        <div class="mt-3 flex flex-col gap-2 border-t border-current/10 pt-4 sm:hidden">
          <PbButton v-if="secondaryLabel" variant="secondary" :label="secondaryLabel" :href="secondaryLink" :tone="variant === 'dark' ? 'dark' : 'light'" />
          <PbButton v-if="ctaLabel" :label="ctaLabel" :href="ctaLink" :tone="variant === 'dark' ? 'dark' : 'light'" />
        </div>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import PbButton from '~/components/PbButton.vue'
import { resolveImageSrc } from '~/utils/image'
import { pbHref, truthy, initials } from '~/utils/pb'
import { useCollection, pickWith, toFieldMap, FIELD_ALIASES } from '~/composables/useCollection'

interface MenuItem {
  title: string
  path: string
  children?: Array<{ title: string; path: string }>
}

const props = withDefaults(
  defineProps<{
    logo?: string
    brandName?: string
    menus?: MenuItem[]
    ctaLabel?: string
    ctaLink?: string
    secondaryLabel?: string
    secondaryLink?: string
    variant?: string
    sticky?: boolean | string
    apiCollection?: string
    apiLimit?: string | number
    apiSort?: string
    apiFields?: Array<{ key?: string; value?: string }>
  }>(),
  {
    logo: '',
    brandName: '',
    menus: () => [],
    ctaLabel: '',
    ctaLink: '#',
    secondaryLabel: '',
    secondaryLink: '#',
    variant: 'glass',
    sticky: true,
    apiCollection: '',
    apiLimit: 20,
    apiSort: '',
    apiFields: () => [],
  }
)

const open = ref(false)
const logoSrc = computed(() => resolveImageSrc(props.logo))
const fieldMap = computed(() => toFieldMap(props.apiFields))

const { items: menuItems } = useCollection<MenuItem>(() => props.apiCollection, {
  fallback: () => props.menus,
  limit: () => props.apiLimit,
  sort: () => props.apiSort,
  map: (row) => ({
    title: pickWith(row, fieldMap.value.title, FIELD_ALIASES.title, 'Untitled'),
    path: pickWith(row, fieldMap.value.path, FIELD_ALIASES.path, '/'),
  }),
})

const styleClass = computed(
  () =>
    ({
      light: 'bg-white text-ink border-b border-slate-200/80',
      glass: 'bg-white/75 text-ink backdrop-blur-xl border-b border-slate-200/60',
      dark: 'bg-night text-white border-b border-white/10',
    })[props.variant] ?? 'bg-white/75 text-ink backdrop-blur-xl border-b border-slate-200/60'
)
</script>
