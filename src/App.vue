<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <RouterLink to="/">Home</RouterLink>
  </header>

  <main>
    <RouterView />
  </main>
</template>
