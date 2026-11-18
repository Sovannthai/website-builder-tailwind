<template>
  <!-- A product-screenshot stand-in drawn in HTML, tinted with the accent colour. -->
  <div class="pb-mockup overflow-hidden rounded-card border border-slate-200 bg-white text-ink shadow-2xl shadow-slate-900/15">
    <div class="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
      <span class="h-2.5 w-2.5 rounded-full bg-rose-300" />
      <span class="h-2.5 w-2.5 rounded-full bg-amber-300" />
      <span class="h-2.5 w-2.5 rounded-full bg-emerald-300" />
      <span class="ml-3 h-5 flex-1 rounded-full bg-white ring-1 ring-slate-200" />
    </div>
    <div class="grid grid-cols-[auto_1fr]">
      <aside class="hidden w-36 flex-col gap-2 border-r border-slate-100 p-4 sm:flex">
        <span class="mb-2 h-6 w-20 rounded-md bg-brand/80" />
        <span v-for="n in 5" :key="n" :class="['h-3 rounded', n === 1 ? 'w-24 bg-brand/25' : 'w-20 bg-slate-100']" />
      </aside>
      <div class="flex flex-col gap-4 p-4 sm:p-5">
        <div v-if="cards.length" class="grid gap-3" :style="{ gridTemplateColumns: `repeat(${cards.length}, minmax(0, 1fr))` }">
          <div v-for="(stat, i) in cards" :key="i" class="rounded-lg border border-slate-100 p-3">
            <p class="text-[10px] font-medium uppercase tracking-wide text-slate-400">{{ stat.label }}</p>
            <p class="mt-1 font-display text-base font-semibold sm:text-lead">{{ stat.value }}</p>
            <p v-if="stat.change" :class="['text-[10px] font-medium', isDown(stat) ? 'text-rose-500' : 'text-emerald-600']">{{ stat.change }}</p>
          </div>
        </div>
        <div class="rounded-lg border border-slate-100 p-3">
          <div class="mb-3 flex items-center justify-between">
            <span class="h-3 w-24 rounded bg-slate-200" />
            <span class="h-5 w-16 rounded-full bg-brand/15" />
          </div>
          <div class="flex h-28 items-end gap-1.5 sm:h-36">
            <span
              v-for="(h, i) in bars"
              :key="i"
              class="flex-1 rounded-t-sm"
              :class="i === bars.length - 3 ? 'bg-brand' : 'bg-brand/25'"
              :style="{ height: `${h}%` }"
            />
          </div>
        </div>
        <div class="flex flex-col gap-2">
          <div v-for="n in 3" :key="n" class="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2">
            <span class="h-6 w-6 rounded-full bg-brand/20" />
            <span class="h-2.5 flex-1 rounded bg-slate-100" />
            <span class="h-2.5 w-10 rounded bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MOCKUP_STATS, type MockupStat } from '~/utils/pb'

// The stat cards are the mockup's only text; the rest are placeholder bars.
// No stats prop (an older page) shows the sample cards; an empty list hides them.
const props = defineProps<{ stats?: MockupStat[] }>()
const cards = computed(() => (Array.isArray(props.stats) ? props.stats : MOCKUP_STATS).slice(0, 4))

/** "down" colours the change red; otherwise it's green. */
const isDown = (stat: MockupStat) => stat.trend === 'down'

const bars = [38, 52, 44, 66, 58, 72, 61, 80, 74, 92, 70, 86]
</script>
