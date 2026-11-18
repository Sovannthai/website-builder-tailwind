<template>
  <div :class="['pb-heading', align === 'center' ? 'mx-auto text-center' : '', maxClass]">
    <p
      v-if="eyebrow"
      class="mb-4 inline-flex items-center gap-2 text-fine font-semibold uppercase tracking-[0.14em] text-current/60"
    >
      <span class="h-1.5 w-1.5 rounded-full bg-brand" :class="onBrand ? 'bg-current' : ''" />
      {{ eyebrow }}
    </p>
    <component
      :is="level"
      v-if="title"
      :class="[
        'font-display font-semibold tracking-tight text-balance',
        size === 'xl'
          ? 'text-4xl leading-[1.05] sm:text-5xl lg:text-6xl'
          : 'text-3xl leading-tight sm:text-4xl',
      ]"
    >
      <template v-for="(part, i) in segments" :key="i">
        <span v-if="part.mark" :class="onBrand ? 'underline decoration-current/40 underline-offset-8' : 'text-brand-text'">{{ part.text }}</span>
        <template v-else>{{ part.text }}</template>
      </template>
    </component>
    <p v-if="subtitle" :class="['mt-5 text-pretty text-current/70', size === 'xl' ? 'text-lead sm:text-big' : 'text-lead']">
      {{ subtitle }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { markedSegments } from '~/utils/pb'

/** Eyebrow + title + subtitle. Wrap words in *asterisks* to highlight them. */
const props = withDefaults(
  defineProps<{
    eyebrow?: string
    title?: string
    subtitle?: string
    align?: string
    size?: 'md' | 'xl'
    level?: 'h1' | 'h2'
    /** True on brand-tone sections, where the accent colour can't highlight. */
    onBrand?: boolean
  }>(),
  { eyebrow: '', title: '', subtitle: '', align: 'left', size: 'md', level: 'h2', onBrand: false }
)

const segments = computed(() => markedSegments(props.title))
const maxClass = computed(() => (props.size === 'xl' ? 'max-w-4xl' : 'max-w-2xl'))
</script>
