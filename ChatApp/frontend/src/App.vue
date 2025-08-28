<template>
  <div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4">
      <div class="flex justify-center items-center min-h-screen">
        <div class="w-full max-w-6xl">
          <div v-if="currentView === 'login'">
              <LoginComponent 
                @switch-to-signup="switchToSignup"
                @login-success="handleLoginSuccess"
              />
            </div>
            
            <div v-if="currentView === 'signup'" >
              <SignupComponent 
                @switch-to-login="switchToLogin"
                @signup-success="handleSignupSuccess"
              />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LoginComponent from './components/login.vue'
import SignupComponent from './components/signup.vue'

const currentView = ref<'login' | 'signup'>('login')

const switchToSignup = (): void => {
  currentView.value = 'signup'
}


const switchToLogin = (): void => {
  currentView.value = 'login'
}

const handleLoginSuccess = (userData: any): void => {
  console.log('Login successful:', userData)
}

const handleSignupSuccess = (userData: any): void => {
  console.log('Signup successful:', userData)
  switchToLogin()
}
</script>