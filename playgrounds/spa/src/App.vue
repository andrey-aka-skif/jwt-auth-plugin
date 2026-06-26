<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useAuth } from '@andrey-aka-skif/jwt-auth-plugin'
import { computed } from 'vue'

const { user, logout, isReady } = useAuth()

const showPlaceholder = computed(() => !isReady.value)
</script>

<template>
  <header class="header">
    <RouterLink :to="{ name: 'home' }">Home</RouterLink>
    <RouterLink :to="{ name: 'profile' }">Profile</RouterLink>
    <RouterLink :to="{ name: 'login' }">Login</RouterLink>
    <span>User: {{ user?.email || 'Guest' }}</span>
    <button v-if="user" @click="logout">logout</button>
  </header>

  <main>
    <p v-if="showPlaceholder">Processing...</p>
    <RouterView v-else />
  </main>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Разделитель перед всеми элементами, кроме первого и кнопки */
.header > *:not(:first-child):not(button)::before {
  content: '|';
  margin-right: 12px;
  color: #ccc;
}
</style>
