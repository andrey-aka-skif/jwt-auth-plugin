<script setup>
import { useDataService } from '@/shared/services/dataService'

const { data, fetchData } = useDataService()
</script>

<template>
  <h1>Profile</h1>

  <p>{{ data }}</p>

  <div><button @click="fetchData">Update()</button></div>
</template>
