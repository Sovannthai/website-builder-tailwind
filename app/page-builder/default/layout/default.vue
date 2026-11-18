<template>
  <div class="wswg-layout wswg-layout--default" :style="layoutStyle">
    <slot />
  </div>
</template>

<script lang="ts">
// Normal script block: exposes layout-level "Page settings" fields to the
// wswg editor. PageSettings reads `layout.fields` off the component options,
// so these must live on the component itself (not only in <script setup>).
import { createField } from "vue-wswg-editor";

export default {
  label: "Default Layout",
  fields: {
    // --- Theme: drives the --pb-* variables every modern block reads -------
    accentColor: createField.color({
      label: "Accent colour",
      description: "Buttons, highlights and brand-tone sections.",
      default: "#4f46e5",
      group: "Theme",
    }),
    font: createField.select(
      [
        { label: "Modern (Inter)", value: "modern", id: "ft-modern" },
        { label: "Friendly (Plus Jakarta Sans)", value: "friendly", id: "ft-friendly" },
        { label: "Tech (Space Grotesk)", value: "tech", id: "ft-tech" },
        { label: "Editorial (Fraunces + Inter)", value: "editorial", id: "ft-editorial" },
      ],
      { label: "Font", default: "modern", group: "Theme" }
    ),
    corners: createField.select(
      [
        { label: "Sharp", value: "sharp", id: "cr-sharp" },
        { label: "Soft", value: "soft", id: "cr-soft" },
        { label: "Round", value: "round", id: "cr-round" },
      ],
      { label: "Corners", default: "soft", group: "Theme" }
    ),

    // --- Layout -------------------------------------------------------------
    containerWidth: createField.select(
      [
        { label: "Full width", value: "full", id: "cw-full" },
        { label: "Boxed", value: "boxed", id: "cw-boxed" },
      ],
      {
        label: "Container width",
        description: "Modern blocks centre their own content, so Full width suits them.",
        default: "full",
        group: "Layout",
      }
    ),
    maxWidth: createField.select(
      [
        { label: "1024px", value: "1024", id: "mw-1024" },
        { label: "1280px", value: "1280", id: "mw-1280" },
        { label: "1440px", value: "1440", id: "mw-1440" },
      ],
      {
        label: "Max content width",
        default: "1280",
        group: "Layout",
        // Only relevant when the container is boxed
        conditions: (data: Record<string, any>) => data.containerWidth === "boxed",
      }
    ),
    pagePadding: createField.select(
      [
        { label: "None", value: "none", id: "pp-none" },
        { label: "Small", value: "small", id: "pp-small" },
        { label: "Medium", value: "medium", id: "pp-medium" },
        { label: "Large", value: "large", id: "pp-large" },
      ],
      { label: "Side padding", default: "none", group: "Layout" }
    ),
    footerSpacing: createField.boolean({
      label: "Add spacing above footer",
      default: false,
      group: "Layout",
    }),
  },
};
</script>

<script setup lang="ts">
import { computed } from "vue";
import { pageLayoutStyle } from "~/utils/pb";

// Page settings are spread onto the layout as props by the (Editor)PageRenderer.
// pageLayoutStyle() applies the same defaults as the fields above, so a page
// with no saved settings still renders correctly.
const props = defineProps<{
  accentColor?: string;
  font?: string;
  corners?: string;
  containerWidth?: string;
  maxWidth?: string;
  pagePadding?: string;
  footerSpacing?: boolean;
}>();

const layoutStyle = computed(() => pageLayoutStyle(props));
</script>

<style scoped>
.wswg-layout--default {
  width: 100%;
  margin: 0 auto;
  background: #fff;
  color: var(--pb-ink, #0f172a);
  font-family: var(--pb-font-body, "Inter", sans-serif);
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
</style>
