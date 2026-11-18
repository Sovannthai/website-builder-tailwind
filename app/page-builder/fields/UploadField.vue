<template>
  <!-- A URL text field plus an Upload button that sends the file to
       /api/upload and fills in the URL. Used by createField.custom() in
       block fields.ts files (see uploadField() in app/utils/pb-fields.ts). -->
  <div class="pb-upload-field">
    <div class="pb-upload-field__row">
      <input
        :value="modelValue ?? ''"
        type="text"
        class="form-control"
        :placeholder="placeholder"
        :disabled="!editable || busy"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <button type="button" class="pb-upload-field__btn" :disabled="!editable || busy" @click="input?.click()">
        {{ busy ? `${progress}%` : "Upload" }}
      </button>
      <input ref="input" type="file" :accept="accept" hidden @change="onPick" />
    </div>
    <p v-if="error" class="pb-upload-field__msg pb-upload-field__msg--error">{{ error }}</p>
    <p v-else-if="done" class="pb-upload-field__msg">Uploaded. Save the page to keep it.</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    editable?: boolean;
    /** "video" or "model": what /api/upload accepts. */
    uploadKind?: string;
    accept?: string;
    placeholder?: string;
  }>(),
  { modelValue: "", editable: true, uploadKind: "", accept: "", placeholder: "" }
);
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const input = ref<HTMLInputElement | null>(null);
const busy = ref(false);
const progress = ref(0);
const error = ref("");
const done = ref(false);

function onPick(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  (event.target as HTMLInputElement).value = ""; // allow picking the same file again
  if (!file) return;

  error.value = "";
  done.value = false;
  busy.value = true;
  progress.value = 0;

  // XMLHttpRequest rather than fetch, for upload progress on big videos.
  const form = new FormData();
  form.append("file", file);
  const xhr = new XMLHttpRequest();
  xhr.open("POST", `/api/upload${props.uploadKind ? `?kind=${encodeURIComponent(props.uploadKind)}` : ""}`);
  xhr.upload.onprogress = (e) => {
    if (e.lengthComputable) progress.value = Math.round((e.loaded / e.total) * 100);
  };
  xhr.onload = () => {
    busy.value = false;
    let body: any = null;
    try {
      body = JSON.parse(xhr.responseText);
    } catch {
      /* not JSON */
    }
    if (xhr.status >= 200 && xhr.status < 300 && body?.url) {
      emit("update:modelValue", body.url);
      done.value = true;
    } else {
      error.value = body?.statusMessage || body?.message || `Upload failed (${xhr.status}).`;
    }
  };
  xhr.onerror = () => {
    busy.value = false;
    error.value = "Upload failed: network error.";
  };
  xhr.send(form);
}
</script>

<style scoped>
.pb-upload-field__row {
  display: flex;
  gap: 6px;
}
.pb-upload-field__row .form-control {
  flex: 1;
  min-width: 0;
}
.pb-upload-field__btn {
  flex-shrink: 0;
  padding: 0 12px;
  border: 1px solid #c7d2fe;
  border-radius: 6px;
  background: #eef2ff;
  color: #3730a3;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  min-width: 64px;
}
.pb-upload-field__btn:hover:not(:disabled) {
  background: #e0e7ff;
}
.pb-upload-field__btn:disabled {
  opacity: 0.6;
  cursor: default;
}
.pb-upload-field__msg {
  margin: 6px 0 0;
  font-size: 12px;
  color: #047857;
}
.pb-upload-field__msg--error {
  color: #b91c1c;
}
</style>
