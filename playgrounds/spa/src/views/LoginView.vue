<script setup>
import { ref } from 'vue'
import { useAuth } from '@andrey-aka-skif/jwt-auth-plugin'

const { login, isAuthenticated: isAuth, user } = useAuth()

const email_placeholder = 'admin@test.com'
const password_placeholder = 'password123'

const email = ref(email_placeholder)
const password = ref(password_placeholder)

const onSubmit = async () => {
  await login({ email: email.value, password: password.value })
}
</script>

<template>
  <div class="form-wrapper">
    <div v-if="!isAuth" class="form">
      <h1>Login</h1>

      <div class="form-line">
        <label for="email">e-mail [{{ email_placeholder }}]</label>
        <input type="text" id="email" autocomplete="on" v-model="email" />
      </div>

      <div class="form-line">
        <label for="password">password [{{ password_placeholder }}]</label>
        <input type="password" id="password" v-model="password" />
      </div>

      <input type="submit" value="Login" @click="onSubmit" />
    </div>

    <div v-else>Пользователь `{{ user.email }}` уже авторизован.</div>
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
