<template>
  <PbSection :tone="tone" :space="space" :anchor="anchor">
    <div class="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
      <div>
        <PbHeading :eyebrow="eyebrow" :title="title" :subtitle="subtitle" :on-brand="tone === 'brand'" />
        <ul v-if="details.length" class="mt-10 flex flex-col gap-6">
          <li v-for="(d, i) in details" :key="i" class="flex items-start gap-4">
            <span :class="['flex h-11 w-11 shrink-0 items-center justify-center rounded-[calc(var(--radius-card)*0.6)]', tone === 'brand' ? 'bg-current/15' : 'bg-brand/10 text-brand-text']">
              <i :class="[mdiClass(d.icon || 'information-outline'), 'text-[22px] leading-none']" />
            </span>
            <div>
              <p class="text-small text-current/60">{{ d.label }}</p>
              <a v-if="d.link" :href="pbHref(d.link)" class="font-semibold hover:underline">{{ d.value }}</a>
              <p v-else class="font-semibold">{{ d.value }}</p>
            </div>
          </li>
        </ul>
      </div>

      <form
        :class="['rounded-card p-6 text-ink sm:p-8', tone === 'light' ? 'border border-slate-200 bg-slate-50/60' : 'bg-white shadow-xl shadow-slate-900/10']"
        @submit.prevent="submit"
      >
        <div class="grid gap-5 sm:grid-cols-2">
          <label class="flex flex-col gap-1.5">
            <span class="text-small font-medium">{{ nameLabel }}</span>
            <input v-model="form.name" required type="text" autocomplete="name" :class="inputClass" />
          </label>
          <label class="flex flex-col gap-1.5">
            <span class="text-small font-medium">{{ emailLabel }}</span>
            <input v-model="form.email" required type="email" autocomplete="email" :class="inputClass" />
          </label>
          <label v-if="truthy(showPhone)" class="flex flex-col gap-1.5 sm:col-span-2">
            <span class="text-small font-medium">{{ phoneLabel }}</span>
            <input v-model="form.phone" type="tel" autocomplete="tel" :class="inputClass" />
          </label>
          <label v-if="topicOptions.length" class="flex flex-col gap-1.5 sm:col-span-2">
            <span class="text-small font-medium">{{ topicLabel }}</span>
            <select v-model="form.topic" :class="inputClass">
              <option v-for="t in topicOptions" :key="t" :value="t">{{ t }}</option>
            </select>
          </label>
          <label class="flex flex-col gap-1.5 sm:col-span-2">
            <span class="text-small font-medium">{{ messageLabel }}</span>
            <textarea v-model="form.message" required rows="5" :class="inputClass" />
          </label>
        </div>
        <button
          type="submit"
          :disabled="status === 'sending'"
          class="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-btn bg-brand px-6 py-3.5 text-small font-semibold text-brand-ink transition hover:opacity-90 disabled:opacity-60"
        >
          <i v-if="status === 'sending'" class="mdi mdi-loading mdi-spin" />
          {{ submitLabel }}
        </button>
        <p v-if="status === 'sent'" class="mt-4 flex items-center gap-2 text-small text-emerald-700">
          <i class="mdi mdi-check-circle" /> {{ successMessage }}
        </p>
        <p v-else-if="status === 'error'" class="mt-4 text-small text-error">{{ errorMessage }}</p>
      </form>
    </div>
  </PbSection>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import PbSection from '~/components/PbSection.vue'
import PbHeading from '~/components/PbHeading.vue'
import { post } from '~/utils/api'
import { lines, mdiClass, pbHref, truthy } from '~/utils/pb'

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    title?: string
    subtitle?: string
    details?: Array<{ icon?: string; label: string; value: string; link?: string }>
    showPhone?: boolean | string
    topics?: string
    submitLabel?: string
    successMessage?: string
    nameLabel?: string
    emailLabel?: string
    phoneLabel?: string
    topicLabel?: string
    messageLabel?: string
    errorMessage?: string
    endpoint?: string
    tone?: string
    space?: 'sm' | 'md' | 'lg'
    anchor?: string
  }>(),
  {
    eyebrow: '',
    title: 'Get in *touch*',
    subtitle: '',
    details: () => [],
    showPhone: false,
    topics: '',
    submitLabel: 'Send message',
    successMessage: "Thanks! We'll get back to you soon.",
    nameLabel: 'Name',
    emailLabel: 'Email',
    phoneLabel: 'Phone',
    topicLabel: 'Topic',
    messageLabel: 'Message',
    errorMessage: 'Something went wrong. Please try again.',
    endpoint: '',
    tone: 'light',
    space: 'md',
    anchor: 'contact',
  }
)

const topicOptions = computed(() => lines(props.topics))
const form = reactive({ name: '', email: '', phone: '', topic: '', message: '' })
const status = ref<'idle' | 'sending' | 'sent' | 'error'>('idle')

const inputClass =
  'w-full rounded-[calc(var(--radius-card)*0.6)] border border-slate-300 bg-white px-3.5 py-2.5 text-base outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/15'

/** Posts to the configured endpoint; without one the form only confirms locally (preview). */
async function submit() {
  status.value = 'sending'
  try {
    if (props.endpoint) await post(props.endpoint, { ...form, topic: form.topic || topicOptions.value[0] || '' })
    status.value = 'sent'
    Object.assign(form, { name: '', email: '', phone: '', topic: '', message: '' })
  } catch {
    status.value = 'error'
  }
}
</script>
