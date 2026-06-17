<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useAuth } from '@andrey-aka-skif/jwt-auth-plugin'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
const { user, logout, isReady } = useAuth()

const showPlaceholder = computed(() => {
  return route.meta.auth && !isReady.value
})
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
    <p v-if="showPlaceholder">Processing...</p>
    <RouterView v-else />
  </main>
</template>
