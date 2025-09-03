<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Authentication Views -->
    <div v-if="!isAuthenticated" class="container mx-auto px-4">
      <div class="flex justify-center items-center min-h-screen">
        <div class="w-full max-w-6xl">
          <div v-if="currentView === 'login'">
            <LoginComponent 
              @switch-to-signup="switchToSignup"
              @login-success="handleLoginSuccess"
            />
          </div>
          
          <div v-if="currentView === 'signup'">
            <SignupComponent 
              @switch-to-login="switchToLogin"
              @signup-success="handleSignupSuccess"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Chat Interface -->
    <div v-else class="h-screen">
      <ChatInterface 
        :userData="userData"
        @logout="handleLogout"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import LoginComponent from './components/login.vue'
import SignupComponent from './components/signup.vue'
import ChatInterface from './components/ChatInterface.vue'

const currentView = ref<'login' | 'signup'>('login')
const isAuthenticated = ref<boolean>(false)
const userData = ref<any>(null)

// Check if user is already authenticated on app load
onMounted(() => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    // You might want to validate the token with the backend
    // For now, we'll assume it's valid if it exists
    isAuthenticated.value = true
    
    // Try to get user data from token or make an API call
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      userData.value = {
        user: {
          id: payload.sub,
          email: payload.email,
          username: payload.username || payload.email.split('@')[0]
        }
      }
    } catch (error) {
      // If token is invalid, clear it and show login
      localStorage.removeItem('auth_token')
      isAuthenticated.value = false
    }
  }
})

const switchToSignup = (): void => {
  currentView.value = 'signup'
}

const switchToLogin = (): void => {
  currentView.value = 'login'
}

const handleLoginSuccess = (userDataResponse: any): void => {
  console.log('Login successful:', userDataResponse)
  userData.value = userDataResponse
  isAuthenticated.value = true
}

const handleSignupSuccess = (userDataResponse: any): void => {
  console.log('Signup successful:', userDataResponse)
  switchToLogin()
}

const handleLogout = (): void => {
  localStorage.removeItem('auth_token')
  userData.value = null
  isAuthenticated.value = false
  currentView.value = 'login'
}
</script>