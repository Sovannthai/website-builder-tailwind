<template>
  <div class="error-page">
    <div class="w-full max-w-lg mx-4 rounded-2xl bg-white shadow-xl p-10 text-center">
      <div class="error-code mb-4">404</div>

      <h2 class="text-2xl font-medium mb-2">
        Page Not Found
      </h2>

      <p class="text-neutral-500 mb-8">
        Sorry, the page you’re looking for doesn’t exist or has been moved.
      </p>

      <div class="flex justify-center gap-4 flex-wrap">
        <NuxtLink
          to="/"
          class="rounded-lg bg-brand px-6 py-3 font-semibold text-brand-ink hover:opacity-90 transition-opacity"
        >
          Go Home
        </NuxtLink>

        <button
          type="button"
          class="rounded-lg border border-neutral-300 px-6 py-3 font-semibold hover:bg-neutral-50 transition-colors"
          @click="goBack"
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const goBack = () => {
  window.history.length > 1
    ? window.history.back()
    : window.location.href = "/"
}
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-code {
  font-size: 120px;
  font-weight: 900;
  line-height: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -5px;
  text-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
}
</style>
