<template>
  <!-- Modal backdrop -->
  <div
  class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
>
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
      <!-- Header -->
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Start New Chat</h3>
          <button
            @click="$emit('close')"
            class="text-gray-400 hover:cursor-pointer hover:text-gray-600 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6">
        <div class="mb-4">
          <label for="search" class="block text-sm font-medium text-gray-700 mb-2">
            Search users by email or username
          </label>
          <div class="relative">
            <input
              id="search"
              v-model="searchQuery"
              type="text"
              placeholder="Enter email or username..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              @input="handleSearch"
            >
            <svg class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="isSearching" class="flex justify-center py-4">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>

        <!-- Search results -->
        <div v-else-if="searchResults.length > 0" class="space-y-2 max-h-60 overflow-y-auto">
          <div
            v-for="user in searchResults"
            :key="user.id"
            @click="selectUser(user)"
            class="flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            :class="{ 'bg-blue-50 border border-blue-200': selectedUser?.id === user.id }"
          >
            <div class="w-10 h-10 bg-[#014f86] rounded-full flex items-center justify-center text-white font-semibold">
              {{ user.username.charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1">
              <div class="font-medium text-gray-900">{{ user.username }}</div>
              <div class="text-sm text-gray-500">{{ user.email }}</div>
            </div>
            <div v-if="user.isActive" class="w-3 h-3 bg-green-400 rounded-full" title="Online"></div>
          </div>
        </div>

        <!-- No results -->
        <div v-else-if="searchQuery && !isSearching" class="text-center py-8 text-gray-500">
          <div class="text-4xl mb-2">🔍</div>
          <p>No users found</p>
          <p class="text-sm mt-1">Try searching with a different email or username</p>
        </div>

        <!-- Empty state -->
        <div v-else class="text-center py-8 text-gray-400">
          <div class="text-4xl mb-2">👥</div>
          <p>Search for users to start chatting</p>
          <p class="text-sm mt-1">Enter an email or username above</p>
        </div>

        <!-- Error message -->
        <div v-if="errorMessage" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-700 text-sm">{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-6 border-t border-gray-200 flex justify-end space-x-3">
        <button
          @click="$emit('close')"
          class="px-4 py-2 hover:cursor-pointer text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          @click="createChat"
          :disabled="!selectedUser || isCreating"
          class="px-4 hover:cursor-pointer py-2 bg-[#2c7da0] text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          <span v-if="isCreating">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          </span>
          <span v-else>Start Chat</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'
import type { User } from '../types/chat';

// Emits
const emit = defineEmits<{
  'close': []
  'create': [email: string]
}>()

// State
const searchQuery = ref('')
const searchResults = ref<User[]>([])
const selectedUser = ref<User | null>(null)
const isSearching = ref(false)
const isCreating = ref(false)
const errorMessage = ref('')

let searchTimeout: ReturnType<typeof setTimeout> | null = null

const API_BASE_URL = 'http://localhost:3000/api'

// Methods
const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  if (!searchQuery.value.trim()) {
    searchResults.value = []
    selectedUser.value = null
    return
  }

  searchTimeout = setTimeout(async () => {
    try {
      isSearching.value = true
      errorMessage.value = ''

      const token = localStorage.getItem('auth_token')
      const response = await axios.get(`${API_BASE_URL}/chat/users/search`, {
        params: { query: searchQuery.value.trim() },
        headers: { Authorization: `Bearer ${token}` }
      })

      searchResults.value = response.data
    } catch (error) {
      console.error('Search error:', error)
      errorMessage.value = 'Failed to search users. Please try again.'
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 300)
}

const selectUser = (user: User) => {
  selectedUser.value = user
  console.log('Selected user:', user)
}

const createChat = async () => {
  if (!selectedUser.value) return

  try {
    isCreating.value = true
    errorMessage.value = ''

    await emit('create', selectedUser.value.email)
  } catch (error) {
    console.error('Create chat error:', error)
    errorMessage.value = 'Failed to create chat. Please try again.'
  } finally {
    isCreating.value = false
  }
}
</script>