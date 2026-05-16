<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useAuth } from './app/plugins/JwtAuthViaAxios'

const { user, logout, isProcessing } = useAuth()
</script>

<template>
  <header>
    <RouterLink :to="{ name: 'home' }">Home</RouterLink>
    &nbsp;|&nbsp;
    <RouterLink :to="{ name: 'profile' }">Profile</RouterLink>
    &nbsp;|&nbsp;
    <RouterLink :to="{ name: 'login' }">Login</RouterLink>
    &nbsp;|&nbsp; User: {{ user?.email }}
    <button @click="logout">logout</button>
  </header>

  <main>
    <p v-if="isProcessing">Processing...</p>
    <RouterView v-else />
  </main>
</template>
