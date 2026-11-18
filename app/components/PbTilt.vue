<template>
  <!-- Tilts its content in 3D toward the cursor, with a soft moving shine. -->
  <div
    ref="root"
    class="pb-tilt [perspective:1200px]"
    @pointermove="onMove"
    @pointerleave="reset"
  >
    <div
      class="relative transition-transform duration-300 ease-out will-change-transform [transform-style:preserve-3d]"
      :style="{ transform: `rotateX(${rx}deg) rotateY(${ry}deg)` }"
    >
      <slot />
      <div
        v-if="enabled"
        class="pointer-events-none absolute inset-0 rounded-card mix-blend-soft-light transition-opacity duration-300"
        :style="{ opacity: active ? 1 : 0, background: `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.45), transparent 55%)` }"
        aria-hidden="true"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{ max?: number }>(), { max: 8 })

const root = ref<HTMLDivElement | null>(null)
const rx = ref(0)
const ry = ref(0)
const gx = ref(50)
const gy = ref(50)
const active = ref(false)
const enabled = ref(true)

onMounted(() => {
  // No tilt for reduced-motion users or touch-only devices.
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const finePointer = window.matchMedia?.('(pointer: fine)').matches ?? true
  enabled.value = !reduce && finePointer
})

function onMove(event: PointerEvent) {
  if (!enabled.value || !root.value) return
  const box = root.value.getBoundingClientRect()
  const x = (event.clientX - box.left) / box.width // 0..1
  const y = (event.clientY - box.top) / box.height
  ry.value = (x - 0.5) * 2 * props.max
  rx.value = (0.5 - y) * 2 * props.max
  gx.value = x * 100
  gy.value = y * 100
  active.value = true
}

function reset() {
  rx.value = 0
  ry.value = 0
  active.value = false
}
</script>
