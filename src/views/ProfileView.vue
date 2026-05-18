<script setup>
import { onMounted } from 'vue'
import { useDataService } from '@/shared/services/dataService'

const { data, getData } = useDataService()

onMounted(async () => getData())
</script>

<template>
  <h1>Profile</h1>

  <p>{{ data }}</p>
</template>
