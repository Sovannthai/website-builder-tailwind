<template>
  <a
    v-if="label"
    :href="pbHref(href)"
    :class="[
      'inline-flex items-center justify-center gap-2 rounded-btn px-5 py-3 text-small font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
      variantClass,
    ]"
  >
    <i v-if="icon" :class="[mdiClass(icon), 'text-[1.1em] leading-none']" />
    {{ label }}
    <i v-if="variant === 'link'" class="mdi mdi-arrow-right text-[1.1em] leading-none transition-transform group-hover:translate-x-0.5" />
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { pbHref, mdiClass } from '~/utils/pb'

/**
 * Tone-aware button. `tone` is the section it sits on, so a primary button
 * on a brand-colour section flips to white instead of vanishing.
 */
const props = withDefaults(
  defineProps<{
    label?: string
    href?: string
    icon?: string
    variant?: 'primary' | 'secondary' | 'link'
    tone?: string
  }>(),
  { label: '', href: '#', icon: '', variant: 'primary', tone: 'light' }
)

const variantClass = computed(() => {
  const onColor = props.tone === 'dark' || props.tone === 'brand'
  if (props.variant === 'link') return 'group px-0 py-1 text-current hover:opacity-80'
  if (props.variant === 'secondary') {
    return onColor
      ? 'border border-current/25 text-current hover:bg-current/10'
      : 'border border-ink/15 bg-white text-ink shadow-sm hover:border-ink/30 hover:bg-slate-50'
  }
  if (props.tone === 'brand') return 'bg-white text-ink shadow-sm hover:-translate-y-0.5 hover:shadow-lg'
  return 'bg-brand text-brand-ink shadow-sm shadow-brand/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand/30'
})
</script>
