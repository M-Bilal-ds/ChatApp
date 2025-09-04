<template>
  <!-- Modal backdrop -->
  <div
  class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
>
    <div class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
      <!-- Header -->
      <div class="p-6 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Create Group Chat</h3>
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
        <!-- Group name -->
        <div class="mb-6">
          <label for="groupName" class="block text-sm font-medium text-gray-700 mb-2">
            Group Name *
          </label>
          <input
            id="groupName"
            v-model="groupName"
            type="text"
            placeholder="Enter group name..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            :class="{ 'border-red-300': !groupName && showValidation }"
          >
          <p v-if="!groupName && showValidation" class="text-red-500 text-sm mt-1">
            Group name is required
          </p>
        </div>

        <!-- Group description -->
        <div class="mb-6">
          <label for="groupDescription" class="block text-sm font-medium text-gray-700 mb-2">
            Description (optional)
          </label>
          <textarea
            id="groupDescription"
            v-model="groupDescription"
            placeholder="Describe what this group is about..."
            rows="3"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          ></textarea>
        </div>

        <!-- Add participants -->
        <div class="mb-4">
          <label for="participantSearch" class="block text-sm font-medium text-gray-700 mb-2">
            Add Participants
          </label>
          <div class="relative">
            <input
              id="participantSearch"
              v-model="searchQuery"
              type="text"
              placeholder="Search users by email or username..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              @input="handleSearch"
            >
            <svg class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>

        <!-- Selected participants -->
        <div v-if="selectedParticipants.length > 0" class="mb-4">
          <div class="flex flex-wrap gap-2">
            <div
              v-for="participant in selectedParticipants"
              :key="participant.id"
              class="flex items-center space-x-2 bg-[#caf0f8] text-[#013a63] px-3 py-1 rounded-full text-sm"
            >
              <span>{{ participant.username }}</span>
              <button
                @click="removeParticipant(participant)"
                class="text-[#013a63] hover:cursor-pointer hover:text-green-800"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="isSearching" class="flex justify-center py-4">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
        </div>

        <!-- Search results -->
        <div v-else-if="searchResults.length > 0" class="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
          <div
            v-for="user in filteredSearchResults"
            :key="user.id"
            @click="addParticipant(user)"
            class="flex items-center space-x-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div class="w-8 h-8 bg-[#014f86] rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {{ user.username.charAt(0).toUpperCase() }}
            </div>
            <div class="flex-1">
              <div class="font-medium text-gray-900 text-sm">{{ user.username }}</div>
              <div class="text-xs text-gray-500">{{ user.email }}</div>
            </div>
            <div v-if="user.isActive" class="w-2 h-2 bg-green-400 rounded-full" title="Online"></div>
          </div>
        </div>

        <!-- No results -->
        <div v-else-if="searchQuery && !isSearching" class="text-center py-4 text-gray-500 text-sm">
          No users found
        </div>

        <!-- Minimum participants warning -->
        <div v-if="selectedParticipants.length === 0 && showValidation" class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p class="text-yellow-700 text-sm">Add at least one participant to create a group</p>
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
          class="px-4 hover:cursor-pointer py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          @click="createGroup"
          :disabled="!canCreate || isCreating"
          class="px-4 hover:cursor-pointer py-2 bg-[#2c7da0] text-white rounded-lg hover:bg-[#2a6f97] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          <span v-if="isCreating">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          </span>
          <span v-else>Create Group</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import axios from 'axios'
import type { User } from '../types/chat'
// Emits
const emit = defineEmits<{
  'close': []
  'create': [data: { name: string; participantEmails: string[]; description?: string }]
}>()

// State
const groupName = ref('')
const groupDescription = ref('')
const searchQuery = ref('')
const searchResults = ref<User[]>([])
const selectedParticipants = ref<User[]>([])
const isSearching = ref(false)
const isCreating = ref(false)
const errorMessage = ref('')
const showValidation = ref(false)

let searchTimeout: ReturnType<typeof setTimeout> | null = null

const API_BASE_URL = 'http://localhost:3000/api'

// Computed
const canCreate = computed(() => {
  return groupName.value.trim() && selectedParticipants.value.length > 0
})

const filteredSearchResults = computed(() => {
  return searchResults.value.filter(user => 
    !selectedParticipants.value.some(p => p.id === user.id)
  )
})

// Methods
const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  if (!searchQuery.value.trim()) {
    searchResults.value = []
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

const addParticipant = (user: User) => {
  if (!selectedParticipants.value.some(p => p.id === user.id)) {
    selectedParticipants.value.push(user)
  }
  searchQuery.value = ''
  searchResults.value = []
}

const removeParticipant = (user: User) => {
  selectedParticipants.value = selectedParticipants.value.filter(p => p.id !== user.id)
}

const createGroup = async () => {
  showValidation.value = true
  
  if (!canCreate.value) {
    return
  }

  try {
    isCreating.value = true
    errorMessage.value = ''

    const data = {
      name: groupName.value.trim(),
      participantEmails: selectedParticipants.value.map(p => p.email),
      description: groupDescription.value.trim() || undefined
    }

    await emit('create', data)
  } catch (error) {
    console.error('Create group error:', error)
    errorMessage.value = 'Failed to create group. Please try again.'
  } finally {
    isCreating.value = false
  }
}
</script>