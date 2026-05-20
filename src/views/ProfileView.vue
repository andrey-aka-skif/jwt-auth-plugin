<script setup>
import { useDataService } from '@/shared/services/dataService'

const { data, getData } = useDataService()
</script>

<template>
  <h1>Profile</h1>

  <p>{{ data }}</p>

  <div><button @click="getData">Update()</button></div>
</template>
