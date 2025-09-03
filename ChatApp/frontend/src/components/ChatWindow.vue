<template>
  <div class="flex flex-col h-full bg-white">
    <!-- Chat Header -->
    <div class="p-4 border-b border-gray-200 bg-white">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <!-- Avatar -->
          <div
            class="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
            :class="conversation.type === 'group' ? 'bg-[#2c7da0]' : 'bg-[#014f86]'"
          >
            <span v-if="conversation.type === 'group'">
              {{ conversation.name.charAt(0).toUpperCase() }}
            </span>
            <span v-else>
              {{ getDirectChatPartner()?.username.charAt(0).toUpperCase() }}
            </span>
          </div>

          <!-- Chat info -->
          <div>
            <h2 class="font-semibold text-gray-900">
              {{ getDisplayName() }}
            </h2>
            <div class="text-sm text-gray-500">
              <span v-if="conversation.type === 'group'">
                {{ conversation.participants.length }} members
                <span v-if="conversation.description"> • {{ conversation.description }}</span>
              </span>
              <span v-else>
                <span v-if="isPartnerOnline()" class="text-green-600">● Online</span>
                <span v-else>Last seen {{ formatLastSeen(getDirectChatPartner()?.lastLogin) }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center space-x-2">
          <button
            v-if="conversation.type === 'group'"
            @click="$emit('add-participants')"
            class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 hover:cursor-pointer rounded-lg transition-colors"
            title="Add participants"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
            </svg>
          </button>
          
          <button
            class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg hover:cursor-pointer transition-colors"
            title="More options"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Messages Area -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
      <div v-if="loading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
      
      <div v-else-if="messages.length === 0" class="flex items-center justify-center h-full text-gray-500">
        <div class="text-center">
          <div class="text-6xl mb-4">💬</div>
          <p class="text-lg">No messages yet</p>
          <p class="text-sm">Start the conversation!</p>
        </div>
      </div>
      
      <div v-else>
        <MessageItem
          v-for="(message, index) in messages"
          :key="message.id"
          :message="message"
          :currentUser="currentUser"
          :showAvatar="shouldShowAvatar(index)"
          :showTimestamp="shouldShowTimestamp(index)"
        />
        
        <!-- Typing indicator -->
        <div v-if="typingUsers.has(conversation.id)" class="flex items-center space-x-2 text-gray-500">
          <div class="flex space-x-1">
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          </div>
          <span class="text-sm">{{ typingUsers.get(conversation.id) }} is typing...</span>
        </div>
      </div>
    </div>

    <!-- Message Input -->
    <div class="p-4 border-t border-gray-200 bg-white">
      <div class="flex items-end space-x-3">
        <div class="flex-1">
          <textarea
            ref="messageInput"
            v-model="messageText"
            @keydown="handleKeyDown"
            @input="handleInput"
            placeholder="Type a message..."
            rows="1"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none max-h-32"
          ></textarea>
        </div>
        
        <button
          @click="sendMessage"
          :disabled="!messageText.trim()"
          class="bg-[#014f86] text-white px-6 py-3 mb-2 rounded-lg font-medium hover:bg-[#013a63] hover:cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from 'vue'
import MessageItem from './MessageItem.vue'
import type { Conversation, Message, User } from '../types/chat'
// Props
const props = defineProps<{
  conversation: Conversation
  messages: Message[]
  currentUser: User | null
  loading: boolean
  typingUsers: Map<string, string>
  onlineUsers?: Set<string>
}>()

// Emits
const emit = defineEmits<{
  'send-message': [content: string]
  'typing-start': []
  'typing-stop': []
  'add-participants': []
}>()

// State
const messageText = ref('')
const messagesContainer = ref<HTMLElement>()
const messageInput = ref<HTMLTextAreaElement>()
let typingTimeout: ReturnType<typeof setTimeout> | null = null
let isTyping = false

// Watch for new messages and scroll to bottom
watch(() => props.messages.length, () => {
  nextTick(() => scrollToBottom())
}, { immediate: true })

// Watch for conversation changes
watch(() => props.conversation.id, () => {
  messageText.value = ''
  nextTick(() => {
    scrollToBottom()
    messageInput.value?.focus()
  })
})

onMounted(() => {
  messageInput.value?.focus()
})

// Methods
const sendMessage = () => {
  const content = messageText.value.trim()
  if (!content) return

  emit('send-message', content)
  messageText.value = ''
  
  // Stop typing indicator
  if (isTyping) {
    emit('typing-stop')
    isTyping = false
  }
  
  // Auto-resize textarea
  if (messageInput.value) {
    messageInput.value.style.height = 'auto'
  }
}

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const handleInput = () => {
  // Auto-resize textarea
  if (messageInput.value) {
    messageInput.value.style.height = 'auto'
    messageInput.value.style.height = messageInput.value.scrollHeight + 'px'
  }

  // Handle typing indicator
  if (messageText.value.trim() && !isTyping) {
    emit('typing-start')
    isTyping = true
  }

  // Clear existing timeout
  if (typingTimeout) {
    clearTimeout(typingTimeout)
  }

  // Set timeout to stop typing
  typingTimeout = setTimeout(() => {
    if (isTyping) {
      emit('typing-stop')
      isTyping = false
    }
  }, 1000)

  // If message is empty, stop typing immediately
  if (!messageText.value.trim() && isTyping) {
    emit('typing-stop')
    isTyping = false
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const getDisplayName = (): string => {
  if (props.conversation.type === 'group') {
    return props.conversation.name
  }
  
  const partner = props.conversation.participants.find(p => p.id !== props.currentUser?.id)
  return partner?.username || 'Unknown User'
}

const getDirectChatPartner = (): User | undefined => {
  if (props.conversation.type !== 'direct') return undefined
  return props.conversation.participants.find(p => p.id !== props.currentUser?.id)
}

const isPartnerOnline = (): boolean => {
  const partner = getDirectChatPartner()
  return partner ? props.onlineUsers?.has(partner.id) || false : false
}

const formatLastSeen = (lastLogin?: Date): string => {
  if (!lastLogin) return 'recently'
  
  const now = new Date()
  const diff = now.getTime() - new Date(lastLogin).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  
  return new Date(lastLogin).toLocaleDateString()
}

const shouldShowAvatar = (index: number): boolean => {
  if (index === 0) return true
  
  const currentMessage = props.messages[index]
  const previousMessage = props.messages[index - 1]
  
  return currentMessage.sender?.id !== previousMessage.sender?.id
}

const shouldShowTimestamp = (_index: number): boolean => {
  return true
}

</script>