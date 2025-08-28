<template>
  <div class="grid md:grid-cols-2 gap-16 items-center">
    <!-- Left Side - Form -->
    <div class="bg-white rounded-2xl shadow-lg p-16 min-w-lg">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="flex items-center justify-center mb-4">
          <div class="bg-blue-500 text-white p-3 rounded-full">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
          </div>
          <span class="ml-2 text-3xl font-bold text-blue-500">ChatApp</span>
        </div>
        <h2 class="text-2xl font-bold text-gray-800">Create your account</h2>
      </div>

      <!-- Signup Form -->
      <form @submit.prevent="handleSignup" class="space-y-6">
        <!-- Email Address -->
        <div>
          <label for="signup-email" class="block text-sm font-medium text-gray-700 mb-2">
            Email address
          </label>
          <input
            id="signup-email"
            v-model="signupForm.email"
            type="email"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="you@example.com"
          />
        </div>

        <!-- Username -->
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            id="username"
            v-model="signupForm.username"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Choose a username"
          />
        </div>

        <!-- Password -->
        <div>
          <label for="signup-password" class="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            id="signup-password"
            v-model="signupForm.password"
            type="password"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Create a strong password"
          />
        </div>

        <!-- Confirm Password -->
        <div>
          <label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-2">
            Confirm password
          </label>
          <input
            id="confirm-password"
            v-model="signupForm.confirmPassword"
            type="password"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Confirm your password"
          />
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full flex hover:cursor-pointer justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isLoading" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating Account...
          </span>
          <span v-else>Create Account</span>
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

      <!-- Login link -->
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          Already have an account?
          <button 
            @click="$emit('switch-to-login')" 
            class="font-medium hover:cursor-pointer text-blue-500 hover:text-blue-400"
          >
            Log in
          </button>
        </p>
      </div>
    </div>

    <!-- Right Side - Features -->
    <div class="max-w-lg">
      <!-- Illustration -->
      <div class="mb-8">
        <div class="relative">
          <!-- Chat bubbles illustration -->
          <div class="flex justify-end mb-4">
            <div class="bg-orange-400 text-white p-3 rounded-2xl rounded-tr-sm max-w-xs">
              <div class="flex space-x-1">
                <div class="w-2 h-2 bg-white rounded-full"></div>
                <div class="w-2 h-2 bg-white rounded-full"></div>
                <div class="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
          <div class="flex justify-start mb-4">
            <div class="bg-blue-500 text-white p-3 rounded-2xl rounded-tl-sm max-w-xs">
              <div class="flex space-x-1">
                <div class="w-2 h-2 bg-white rounded-full"></div>
                <div class="w-2 h-2 bg-white rounded-full"></div>
                <div class="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
          <div class="flex justify-end mb-4">
            <div class="bg-yellow-400 text-white p-3 rounded-2xl rounded-tr-sm max-w-xs">
              <div class="flex space-x-1">
                <div class="w-2 h-2 bg-white rounded-full"></div>
                <div class="w-2 h-2 bg-white rounded-full"></div>
                <div class="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
          
          <!-- Avatar group -->
          <div class="flex justify-center mt-8">
            <div class="flex -space-x-4">
              <div class="w-16 h-16 bg-blue-400 rounded-full border-4 border-white flex items-center justify-center">
                <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="w-16 h-16 bg-orange-400 rounded-full border-4 border-white flex items-center justify-center">
                <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="w-16 h-16 bg-gray-600 rounded-full border-4 border-white flex items-center justify-center">
                <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Features list -->
      <div class="space-y-6">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <div class="bg-blue-100 p-2 rounded-lg">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <h3 class="text-lg font-semibold text-gray-900">Secure Messaging</h3>
            <p class="text-gray-600">End-to-end encryption keeps your conversations private and secure.</p>
          </div>
        </div>

        <div class="flex items-start">
          <div class="flex-shrink-0">
            <div class="bg-blue-100 p-2 rounded-lg">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <h3 class="text-lg font-semibold text-gray-900">Group Chats</h3>
            <p class="text-gray-600">Create groups with friends, family or colleagues for team collaboration.</p>
          </div>
        </div>

        <div class="flex items-start">
          <div class="flex-shrink-0">
            <div class="bg-blue-100 p-2 rounded-lg">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <h3 class="text-lg font-semibold text-gray-900">Personal Profile</h3>
            <p class="text-gray-600">Keep your secured personalized profile.</p>
          </div>
        </div>

        <div class="flex items-start">
          <div class="flex-shrink-0">
            <div class="bg-blue-100 p-2 rounded-lg">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
          </div>
          <div class="ml-4">
            <h3 class="text-lg font-semibold text-gray-900">Real-time Sync</h3>
            <p class="text-gray-600">Your messages sync instantly across all your devices.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

// Define emits
const emit = defineEmits<{
  'switch-to-login': []
  'signup-success': [userData: any]
}>()

// Reactive form data
const signupForm = reactive({
  email: '',
  username: '',
  password: '',
  confirmPassword: ''
})

// Component state
const isLoading = ref<boolean>(false)
const errorMessage = ref<string>('')

// API base URL - adjust according to your backend
const API_BASE_URL = 'http://localhost:3000/api'

// Signup handler
const handleSignup = async (): Promise<void> => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    // Validate form
    if (!signupForm.email || !signupForm.username || !signupForm.password || !signupForm.confirmPassword) {
      throw new Error('Please fill in all fields')
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      throw new Error('Passwords do not match')
    }

    if (signupForm.password.length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }

    // Make API call to backend
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: signupForm.email,
        username: signupForm.username,
        password: signupForm.password
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Signup failed')
    }

    const userData = await response.json()

    // Emit success event
    emit('signup-success', userData)

    // Reset form
    Object.assign(signupForm, {
      email: '',
      username: '',
      password: '',
      confirmPassword: ''
    })

  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'An error occurred during signup'
  } finally {
    isLoading.value = false
  }
}
</script>