<template>
  <!-- A WebGL 3D visual: a glossy shape in the accent colour, or a .glb model.
       three.js is loaded on demand, so pages without a 3D visual don't pay for it. -->
  <div ref="host" :class="['pb-scene3d relative', aspectClass]">
    <canvas ref="canvas" class="absolute inset-0 h-full w-full cursor-grab touch-pan-y active:cursor-grabbing" :aria-label="label || undefined" role="img" />
    <div v-if="state !== 'ready'" class="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div v-if="state === 'loading'" class="h-24 w-24 animate-pulse rounded-full bg-brand/20 blur-xl" />
      <PbMedia v-else aspect="fill" class="!absolute inset-0 !min-h-0" icon="cube-outline" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import PbMedia from '~/components/PbMedia.vue'
import { truthy } from '~/utils/pb'

const props = withDefaults(
  defineProps<{
    /** knot | gem | rings | sphere */
    shape?: string
    /** URL of a .glb/.gltf model; replaces the shape when set. */
    model?: string
    autoRotate?: boolean | string
    aspect?: string
    label?: string
  }>(),
  { shape: 'knot', model: '', autoRotate: true, aspect: '1/1', label: '' }
)

const host = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const state = ref<'loading' | 'ready' | 'error'>('loading')

const aspectClass = computed(
  () => ({ '1/1': 'aspect-square', '4/3': 'aspect-[4/3]', '16/9': 'aspect-video' })[props.aspect] ?? 'aspect-square'
)

// Everything three.js lives here so it can be torn down and rebuilt when the
// shape/model changes in the editor.
let cleanup: (() => void) | null = null

/** The page's accent colour (set by the layout as --pb-accent). */
function accentColour(): string {
  const el = host.value
  const value = el ? getComputedStyle(el).getPropertyValue('--pb-accent').trim() : ''
  return /^#[0-9a-f]{3,8}$/i.test(value) ? value : '#4f46e5'
}

async function build() {
  cleanup?.()
  cleanup = null
  const el = host.value
  const cv = canvas.value
  if (!el || !cv) return
  state.value = 'loading'

  let THREE: typeof import('three')
  let OrbitControls: typeof import('three/examples/jsm/controls/OrbitControls.js').OrbitControls
  let RoomEnvironment: typeof import('three/examples/jsm/environments/RoomEnvironment.js').RoomEnvironment
  try {
    ;[THREE, { OrbitControls }, { RoomEnvironment }] = await Promise.all([
      import('three'),
      import('three/examples/jsm/controls/OrbitControls.js'),
      import('three/examples/jsm/environments/RoomEnvironment.js'),
    ])
  } catch {
    state.value = 'error'
    return
  }

  let renderer: import('three').WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true })
  } catch {
    state.value = 'error' // no WebGL
    return
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environment = envTexture

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100)
  camera.position.set(0, 0, 8)

  const key = new THREE.DirectionalLight(0xffffff, 1.6)
  key.position.set(3, 4, 5)
  scene.add(key, new THREE.AmbientLight(0xffffff, 0.35))

  const group = new THREE.Group()
  scene.add(group)
  const disposables: Array<{ dispose: () => void }> = [envTexture, pmrem]

  const accent = new THREE.Color(accentColour())
  const material = new THREE.MeshPhysicalMaterial({
    color: accent,
    roughness: 0.18,
    metalness: 0.15,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    iridescence: 0.35,
  })
  disposables.push(material)

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  const floaters: import('three').Mesh[] = []

  if (props.model) {
    try {
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
      const gltf = await new GLTFLoader().loadAsync(props.model)
      const model = gltf.scene
      // Centre the model and scale it to fill the view.
      const box = new THREE.Box3().setFromObject(model)
      const size = box.getSize(new THREE.Vector3()).length() || 1
      model.position.sub(box.getCenter(new THREE.Vector3()))
      const wrapper = new THREE.Group()
      wrapper.add(model)
      wrapper.scale.setScalar(4 / size)
      group.add(wrapper)
    } catch {
      renderer.dispose()
      state.value = 'error'
      return
    }
  } else {
    const geometries: Record<string, () => import('three').BufferGeometry> = {
      knot: () => new THREE.TorusKnotGeometry(1, 0.34, 220, 32),
      gem: () => new THREE.IcosahedronGeometry(1.45, 0),
      sphere: () => new THREE.SphereGeometry(1.35, 64, 64),
      rings: () => new THREE.TorusGeometry(1.15, 0.22, 48, 160),
    }
    const shape = geometries[props.shape] ? props.shape : 'knot'
    const geometry = geometries[shape]!()
    disposables.push(geometry)
    if (shape === 'gem') material.flatShading = true
    if (shape === 'rings') {
      // Three interlocked rings
      for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(geometry, material)
        ring.rotation.set((i * Math.PI) / 3, (i * Math.PI) / 4, 0)
        group.add(ring)
      }
    } else {
      group.add(new THREE.Mesh(geometry, material))
    }

    // A few small orbs drifting around the shape for depth.
    const orbGeometry = new THREE.SphereGeometry(1, 32, 32)
    const orbMaterial = material.clone()
    orbMaterial.color = accent.clone().lerp(new THREE.Color('#ffffff'), 0.35)
    disposables.push(orbGeometry, orbMaterial)
    const orbs: Array<[number, number, number, number]> = [
      [-2.1, 1.3, -0.5, 0.22],
      [2.2, -1.1, 0.4, 0.3],
      [1.7, 1.7, -1, 0.14],
    ]
    for (const [x, y, z, r] of orbs) {
      const orb = new THREE.Mesh(orbGeometry, orbMaterial)
      orb.position.set(x, y, z)
      orb.scale.setScalar(r)
      orb.userData.base = y
      scene.add(orb)
      floaters.push(orb)
    }
  }

  const controls = new OrbitControls(camera, cv)
  controls.enableZoom = false
  controls.enablePan = false
  controls.enableDamping = true
  controls.autoRotate = truthy(props.autoRotate) && !reduceMotion
  controls.autoRotateSpeed = 1.6

  // Size the renderer to its box.
  const resize = () => {
    const { width, height } = el.getBoundingClientRect()
    if (!width || !height) return
    renderer.setSize(width, height, false)
    camera.aspect = width / height
    // Keep the object fully in view on narrow (portrait) boxes.
    camera.position.z = camera.aspect < 1 ? 8 / camera.aspect : 8
    camera.updateProjectionMatrix()
  }
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(el)
  resize()

  // Only animate while visible.
  let visible = true
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting
  })
  visibilityObserver.observe(el)

  // Follow the accent colour if it changes (Page settings in the editor).
  let frame = 0
  let raf = 0
  const clock = new THREE.Clock()
  const tick = () => {
    raf = requestAnimationFrame(tick)
    if (!visible) return
    const t = clock.getElapsedTime()
    if (!reduceMotion) {
      group.position.y = Math.sin(t * 1.1) * 0.12
      for (const [i, orb] of floaters.entries()) orb.position.y = orb.userData.base + Math.sin(t * 0.9 + i * 2) * 0.18
    }
    if (++frame % 60 === 0 && !props.model) {
      const next = accentColour()
      if (`#${material.color.getHexString()}` !== next.toLowerCase()) {
        material.color.set(next)
        floaters[0] && (floaters[0].material as import('three').MeshPhysicalMaterial).color.set(next).lerp(new THREE.Color('#ffffff'), 0.35)
      }
    }
    controls.update()
    renderer.render(scene, camera)
  }
  tick()
  state.value = 'ready'

  cleanup = () => {
    cancelAnimationFrame(raf)
    resizeObserver.disconnect()
    visibilityObserver.disconnect()
    controls.dispose()
    scene.traverse((obj) => {
      const mesh = obj as import('three').Mesh
      if (mesh.isMesh && props.model) {
        mesh.geometry?.dispose()
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        mats.forEach((m) => m?.dispose())
      }
    })
    disposables.forEach((d) => d.dispose())
    renderer.dispose()
  }
}

onMounted(build)
watch(() => [props.shape, props.model, props.autoRotate], build)
onBeforeUnmount(() => cleanup?.())
</script>
