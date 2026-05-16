<script setup>
import { computed, ref } from 'vue'
import { useAuthService } from '@/shared/services/authService'

const { login, isAuthenticated: isAuth, user } = useAuthService()

const email_value = 'admin@test.com'
const password_value = 'password123'

const email = computed(() => user.value?.email || email_value)
const password = ref(password_value)

const onSubmit = async () => {
  await login({
    email: email.value,
    password: password.value,
  })
}
</script>

<template>
  {{ email }}:{{ password }}
  <div class="form-wrapper">
    <div v-if="!isAuth" class="form">
      <h1>Login</h1>

      <div class="form-line">
        <label for="email">e-mail</label>
        <input type="text" id="email" autocomplete="on" v-model="email" />
      </div>

      <div class="form-line">
        <label for="password">password</label>
        <input type="password" id="password" v-model="password" />
      </div>

      <input type="submit" value="Login" @click="onSubmit" />
    </div>

    <div v-else>Пользователь {{ email }} уже авторизован.</div>
  </div>
</template>

<style scoped>
.form-wrapper {
  display: flex;
  justify-content: center;
}

.form {
  width: 200px;
  display: flex;
  flex-direction: column;
  gap: 1em;
  border: 1px grey solid;
  border-radius: 5px;
  padding: 1em;
}

.form-line input {
  width: 100%;
  box-sizing: border-box;
}
</style>
