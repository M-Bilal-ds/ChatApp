<template>
  <div class="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 bg-[#014f86] text-white">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <span class="text-sm font-semibold">💬</span>
          </div>
          <h1 class="text-xl font-semibold">ChatApp</h1>
        </div>
        <button @click="$emit('logout')"
          class="text-white hover:cursor-pointer hover:bg-[#2a6f97] rounded-lg p-2 transition-colors" title="Logout">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
        </button>
      </div>

      <!-- User info -->
      <div class="mt-3 text-sm">
        <div class="font-medium">{{ currentUser?.username }}</div>
        <div class="text-blue-100">{{ currentUser?.email }}</div>
      </div>
    </div>

    <!-- Search and Actions -->
    <div class="p-4 border-b border-gray-200">
      <div class="space-y-2">
        <!-- Search chats -->
        <div class="relative">
          <input v-model="searchQuery" type="text" placeholder="Search chats..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <svg class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor"
            viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>

        <!-- Action buttons -->
        <div class="flex space-x-2">
          <button @click="$emit('create-direct-chat')"
            class="flex-1 bg-[#014f86] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#013a63] hover:cursor-pointer transition-colors">
            New Chat
          </button>
          <button @click="$emit('create-group-chat')"
            class="flex-1 bg-[#2c7da0] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#2a6f97] hover:cursor-pointer transition-colors">
            New Group
          </button>
        </div>
      </div>
    </div>

    <!-- Conversations List -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="filteredConversations.length === 0" class="p-4 text-center text-gray-500">
        <div class="text-4xl mb-2">📭</div>
        <p>No conversations yet</p>
        <p class="text-sm mt-1">Start a new chat to get started!</p>
      </div>

      <div v-else class="space-y-1 p-2">
        <div v-for="conversation in filteredConversations" :key="conversation.id"
          @click="$emit('select-conversation', conversation)"
          class="flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors" :class="{
            'bg-blue-50 border-l-4 border-blue-500': selectedConversation?.id === conversation.id,
            'hover:bg-gray-50': selectedConversation?.id !== conversation.id
          }">
          <!-- Avatar -->
          <div class="relative">
            <div class="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
              :class="conversation.type === 'group' ? 'bg-[#2c7da0]' : 'bg-[#014f86]'">
              <span v-if="conversation.type === 'group'">
                {{ conversation.name.charAt(0).toUpperCase() }}
              </span>
              <span v-else>
                {{ getDirectChatPartner(conversation)?.username.charAt(0).toUpperCase() }}
              </span>
            </div>

            <!-- Online indicator for direct chats -->
            <div v-if="conversation.type === 'direct' && isUserOnline(getDirectChatPartner(conversation)?.id)"
              class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <h3 class="font-medium text-gray-900 truncate">
                {{ getConversationDisplayName(conversation) }}
              </h3>
              <span class="text-xs text-gray-500">
                {{ formatTime(conversation.lastActivity) }}
              </span>
            </div>

            <div class="flex items-center justify-between mt-1">
              <p class="text-sm text-gray-600 truncate">
                <span v-if="conversation.lastMessage">
                  <span v-if="conversation.lastMessage.sender?.id === currentUser?.id" class="text-gray-500">You:
                  </span>
                  <span v-else-if="conversation.type === 'group'" class="text-gray-500">
                    {{ conversation.lastMessage.sender?.username }}:
                  </span>
                  {{ conversation.lastMessage.content }}
                </span>
                <span v-else class="text-gray-400 italic">No messages yet</span>
              </p>

              <!-- Unread indicator -->
              <div v-if="conversation.unreadCount && conversation.unreadCount > 0"
                class="bg-blue-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                {{ conversation.unreadCount > 99 ? '99+' : conversation.unreadCount }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { User, Conversation } from '../types/chat'
// Props
const props = defineProps<{
  conversations: Conversation[]
  currentUser: User | null
  selectedConversation: Conversation | null
  onlineUsers: Set<string>
}>()

// Emits
defineEmits<{
  'select-conversation': [conversation: Conversation]
  'create-direct-chat': []
  'create-group-chat': []
  'logout': []
}>()

// State
const searchQuery = ref('')

// Computed
const filteredConversations = computed(() => {
  if (!searchQuery.value) return props.conversations

  return props.conversations.filter(conv =>
    getConversationDisplayName(conv).toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

// Methods
const getConversationDisplayName = (conversation: Conversation): string => {
  if (conversation.type === 'group') {
    return conversation.name
  }

  // For direct chats, show the other participant's name
  const partner = conversation.participants.find(p => p.id !== props.currentUser?.id)
  return partner?.username || 'Unknown User'
}

const getDirectChatPartner = (conversation: Conversation): User | undefined => {
  if (conversation.type !== 'direct') return undefined
  return conversation.participants.find(p => p.id !== props.currentUser?.id)
}

const isUserOnline = (userId?: string): boolean => {
  return userId ? props.onlineUsers.has(userId) : false
}

const formatTime = (date: Date | string): string => {
  const now = new Date()
  const messageDate = new Date(date)
  const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60)

  if (diffInHours < 24) {
    return messageDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } else if (diffInHours < 7 * 24) {
    return messageDate.toLocaleDateString('en-US', { weekday: 'short' })
  } else {
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }
}
</script>