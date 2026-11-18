<template>
  <PbSection :tone="tone" space="none" class="pb-hero">
    <template #background>
      <div v-if="background === 'glow'" class="pointer-events-none absolute inset-0" aria-hidden="true">
        <div class="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-brand/25 blur-[120px]" />
        <div class="absolute -bottom-40 right-0 h-80 w-80 rounded-full bg-brand/15 blur-[100px]" />
      </div>
      <div
        v-else-if="background === 'grid'"
        class="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,color-mix(in_oklab,currentColor_8%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,currentColor_8%,transparent)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]"
        aria-hidden="true"
      />
      <template v-else-if="darkBackdrop">
        <video
          v-if="background === 'video'"
          :src="backgroundVideo"
          :poster="bgSrc || undefined"
          class="absolute inset-0 h-full w-full object-cover"
          autoplay
          muted
          loop
          playsinline
          aria-hidden="true"
        />
        <img v-else :src="bgSrc" alt="" class="absolute inset-0 h-full w-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-night/90 via-night/60 to-night/30" />
      </template>
    </template>

    <div
      :class="[
        'grid items-center gap-12 py-16 sm:py-24 lg:gap-16',
        layout === 'split' ? 'lg:grid-cols-[1.05fr_1fr] lg:py-28' : 'lg:py-32',
        darkBackdrop ? 'text-white' : '',
      ]"
    >
      <div :class="layout === 'split' ? '' : 'mx-auto flex max-w-4xl flex-col items-center text-center'">
        <a
          v-if="badge"
          :href="pbHref(badgeLink)"
          class="mb-7 inline-flex items-center gap-2 rounded-full border border-current/15 bg-current/[0.04] py-1 pl-1 pr-3.5 text-fine font-medium text-current/80 transition-colors hover:border-current/30"
        >
          <span v-if="badgeTag" class="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-ink">{{ badgeTag }}</span>
          {{ badge }}
          <i class="mdi mdi-arrow-right opacity-60" />
        </a>

        <h1 class="font-display text-[2.6rem] font-semibold leading-[1.04] tracking-tight text-balance sm:text-6xl lg:text-7xl">
          <template v-for="(part, i) in segments" :key="i">
            <span v-if="part.mark" :class="tone === 'brand' ? 'italic underline decoration-current/30 underline-offset-[10px]' : 'bg-gradient-to-r from-brand-text to-brand-text/60 bg-clip-text text-transparent'">{{ part.text }}</span>
            <template v-else>{{ part.text }}</template>
          </template>
        </h1>

        <p v-if="subtitle" :class="['mt-6 max-w-2xl text-lead text-pretty text-current/70 sm:text-big', layout === 'split' ? '' : 'mx-auto']">
          {{ subtitle }}
        </p>

        <div :class="['mt-9 flex flex-col gap-3 sm:flex-row', layout === 'split' ? '' : 'justify-center']">
          <PbButton :label="primaryLabel" :href="primaryLink" :tone="tone" class="!px-7 !py-3.5" />
          <PbButton :label="secondaryLabel" :href="secondaryLink" variant="secondary" :tone="tone === 'light' || tone === 'muted' ? 'light' : 'dark'" class="!px-7 !py-3.5" />
        </div>

        <p v-if="note" class="mt-5 flex items-center gap-2 text-fine text-current/55">
          <i class="mdi mdi-check-circle text-brand-text" :class="tone === 'brand' ? '!text-current' : ''" /> {{ note }}
        </p>
      </div>

      <div v-if="visual !== 'none'" :class="layout === 'split' ? 'relative' : 'relative mx-auto w-full max-w-5xl'">
        <div
          :class="['absolute -z-0 rounded-full bg-brand/10 blur-2xl', is3D ? 'inset-[12%] !bg-brand/25 blur-3xl' : '-inset-4 rounded-[calc(var(--radius-card)*1.5)]']"
          aria-hidden="true"
        />
        <PbScene3D
          v-if="is3D"
          class="relative"
          :shape="shape"
          :model="visual === 'model' ? model : ''"
          :auto-rotate="autoRotate"
          :aspect="layout === 'split' ? '1/1' : '16/9'"
          :label="title"
        />
        <component :is="truthy(tilt) ? PbTilt : 'div'" v-else class="relative">
          <PbMockup v-if="visual === 'mockup'" :stats="mockupStats" />
          <div
            v-else-if="visual === 'video'"
            :class="['relative overflow-hidden rounded-card bg-night shadow-2xl shadow-slate-900/20', layout === 'split' ? 'aspect-[4/3]' : 'aspect-video']"
          >
            <video
              v-if="video"
              :src="video"
              :poster="posterSrc || undefined"
              class="h-full w-full object-cover"
              autoplay
              muted
              loop
              playsinline
            />
            <PbMedia v-else aspect="fill" class="!absolute inset-0 !min-h-0" icon="play-circle-outline" />
          </div>
          <PbMedia v-else eager class="shadow-2xl shadow-slate-900/20" :image="image" :aspect="layout === 'split' ? '4/3' : '16/9'" icon="image-outline" />
        </component>
      </div>
    </div>
  </PbSection>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PbSection from '~/components/PbSection.vue'
import PbButton from '~/components/PbButton.vue'
import PbMedia from '~/components/PbMedia.vue'
import PbMockup from '~/components/PbMockup.vue'
import PbScene3D from '~/components/PbScene3D.vue'
import PbTilt from '~/components/PbTilt.vue'
import { resolveImageSrc } from '~/utils/image'
import { markedSegments, pbHref, truthy, type MockupStat } from '~/utils/pb'

const props = withDefaults(
  defineProps<{
    badge?: string
    badgeLink?: string
    badgeTag?: string
    title?: string
    subtitle?: string
    primaryLabel?: string
    primaryLink?: string
    secondaryLabel?: string
    secondaryLink?: string
    note?: string
    layout?: string
    visual?: string
    mockupStats?: MockupStat[]
    image?: string
    video?: string
    videoPoster?: string
    shape?: string
    model?: string
    autoRotate?: boolean | string
    tilt?: boolean | string
    background?: string
    backgroundImage?: string
    backgroundVideo?: string
    tone?: string
  }>(),
  {
    badge: '',
    badgeLink: '#',
    badgeTag: 'New',
    title: 'Build something *people love*',
    subtitle: '',
    primaryLabel: 'Get started',
    primaryLink: '#',
    secondaryLabel: '',
    secondaryLink: '#',
    note: '',
    layout: 'centered',
    visual: 'mockup',
    image: '',
    video: '',
    videoPoster: '',
    shape: 'knot',
    model: '',
    autoRotate: true,
    tilt: false,
    background: 'glow',
    backgroundImage: '',
    backgroundVideo: '',
    tone: 'light',
  }
)

const segments = computed(() => markedSegments(props.title))
const bgSrc = computed(() => resolveImageSrc(props.backgroundImage))
const posterSrc = computed(() => resolveImageSrc(props.videoPoster))
const is3D = computed(() => props.visual === 'shape3d' || props.visual === 'model')
/** Photo or video behind the text: darkened, so the text turns white. */
const darkBackdrop = computed(
  () => (props.background === 'image' && !!bgSrc.value) || (props.background === 'video' && !!props.backgroundVideo)
)
</script>
