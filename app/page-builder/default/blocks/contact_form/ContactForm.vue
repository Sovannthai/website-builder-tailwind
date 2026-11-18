<template>
  <ContactFormView v-bind="props" />
</template>

<script setup lang="ts">
import ContactFormView from '~/components/ContactForm.vue'

defineOptions({ label: "Contact", emoji: "✉️" })

// Untyped on purpose (see app_header/AppHeader.vue). Keep in sync with fields.ts.
const props = defineProps([
  'eyebrow', 'title', 'subtitle', 'details', 'showPhone', 'topics', 'submitLabel', 'successMessage', 'nameLabel', 'emailLabel', 'phoneLabel', 'topicLabel', 'messageLabel', 'errorMessage',
  'endpoint', 'tone', 'space', 'anchor',
])
</script>
