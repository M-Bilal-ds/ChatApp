<template>
  <div class="bg-white rounded-2xl shadow-sm p-16 max-w-lg mx-auto">
    <!-- Header -->
    <div class="text-center mb-8">
      <div class="flex items-center justify-center mb-6">
        <div class="bg-[#014f86] text-white p-3 rounded-full">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
        </div>
        <span class="ml-2 text-3xl font-bold text-[#014f86]">ChatApp</span>
      </div>
      <h2 class="text-2xl font-bold text-gray-800">Log in to your account</h2>
    </div>

    <!-- Login Form -->
    <form @submit.prevent="handleLogin" class="space-y-6">
      <!-- Email Address -->
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
          Email address
        </label>
        <input
          id="email"
          v-model="loginForm.email"
          type="email"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your email"
        />
      </div>

      <!-- Password -->
      <div>
        <div class="flex justify-between">
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          
        </div>
        <input
          id="password"
          v-model="loginForm.password"
          type="password"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your password"
        />
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="isLoading"
        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium hover:cursor-pointer text-white bg-[#014f86] hover:bg-[#013a63] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="isLoading" class="flex items-center">
          <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Logging in...
        </span>
        <span v-else>Log in</span>
      </button>

      <!-- Error Message -->
      <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-md p-3">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-800">{{ errorMessage }}</p>
          </div>
        </div>
      </div>
    </form>

    <!-- Sign up link -->
    <div class="mt-6 text-center">
      <p class="text-sm text-gray-600">
        Don't have an account?
        <button 
          @click="$emit('switch-to-signup')" 
          class="font-medium text-blue-500 hover:text-blue-400 hover:cursor-pointer"
        >
          Sign up
        </button>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

// Define emits
const emit = defineEmits<{
  'switch-to-signup': []
  'login-success': [userData: any]
}>()

// Reactive form data
const loginForm = reactive({
  email: '',
  password: ''
})

// Component state
const isLoading = ref<boolean>(false)
const errorMessage = ref<string>('')

// API base URL - adjust according to your backend
const API_BASE_URL = 'http://localhost:3000/api'

// Login handler
const handleLogin = async (): Promise<void> => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    // Validate form
    if (!loginForm.email || !loginForm.password) {
      throw new Error('Please fill in all fields')
    }

    // Make API call to backend
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: loginForm.email,
        password: loginForm.password
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Login failed')
    }

    const userData = await response.json()
    
    // Store token in localStorage (you might want to use a more secure method)
    if (userData.access_token) {
      localStorage.setItem('auth_token', userData.access_token)
    }

    // Emit success event
    emit('login-success', userData)

  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'An error occurred during login'
  } finally {
    isLoading.value = false
  }
}
</script>