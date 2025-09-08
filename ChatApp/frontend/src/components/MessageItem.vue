<template>
  <div
    class="flex items-start space-x-3 group relative"
    :class="{
      'justify-end': isOwnMessage && !isSystemMessage,
      'justify-center': isSystemMessage,
      'bg-blue-50': isSelected,
      'hover:bg-gray-50': selectionMode && !isSelected && !isSystemMessage && canSelect,
      'cursor-pointer': selectionMode && !isSystemMessage && canSelect
    }"
    @click="handleMessageClick"
  >
    <!-- Selection checkbox -->
    

    <div v-if="selectionMode && !isSystemMessage && canSelect" class="flex-shrink-0 mt-2">
      <div
        class="w-5 h-5 rounded border-2 flex items-center justify-center"
        :class="isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'"
      >
      
        <svg
          v-if="isSelected"
          class="w-3 h-3 text-white"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
        </svg>
      </div>
    </div>

    <!-- System message -->
    <div v-if="isSystemMessage" class="text-center">
      <div class="inline-block bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
        {{ message.content }}
      </div>
      <div v-if="showTimestamp" class="text-xs text-gray-400 mt-1">
        {{ formatTime(message.createdAt) }}
      </div>
    </div>

    <!-- Regular message -->
    <template v-else>
      <!-- Avatar (for other users' messages) -->
      <div v-if="!isOwnMessage && showAvatar" class="flex-shrink-0">
        <div
          class="w-8 h-8 rounded-full bg-[#01497c] flex items-center justify-center text-white text-sm font-semibold"
        >
          {{ message.sender?.username.charAt(0).toUpperCase() }}
        </div>
      </div>
      <div v-else-if="!isOwnMessage && !selectionMode" class="w-8 flex-shrink-0"></div>

      <!-- Message content -->
      <div
        class="max-w-xs lg:max-w-md"
        :class="{
          'order-1': isOwnMessage
        }"
      >
        <!-- Sender name (for group chats and other users) -->
        <div
          v-if="!isOwnMessage && showAvatar && message.sender"
          class="text-sm text-gray-600 mb-1 font-medium"
        >
          {{ message.sender.username }}
        </div>

        <!-- Reply preview -->
        <div v-if="message.replyTo" class="mb-2">
          <div
            class="border-l-4 border-gray-300 bg-gray-50 p-2 rounded text-sm"
            :class="{
              'border-blue-300 bg-blue-50': isOwnMessage,
              'border-gray-300 bg-gray-50': !isOwnMessage
            }"
          >
            <div class="text-gray-600 font-medium text-xs mb-1">
              Replying to {{ message.replyTo.sender?.username || 'Unknown' }}
            </div>
            <div class="text-gray-700 truncate">
              {{ message.replyTo.content }}
            </div>
          </div>
        </div>

        <!-- Message bubble -->
        <div
          class="px-4 py-2 rounded-lg relative"
          :class="{
            'bg-[#01497c] text-white': isOwnMessage,
            'bg-[#2c7da0] text-white': !isOwnMessage,
            'ring-2 ring-blue-500': isSelected
          }"
        >
          <div class="whitespace-pre-wrap break-words">
            {{ message.content }}
          </div>
          
          <!-- Edited indicator -->
          <div v-if="message.edited" class="text-xs opacity-70 mt-1">
            (edited)
          </div>
        </div>

        <!-- Timestamp and read status -->
        <div
          v-if="showTimestamp"
          class="flex items-center mt-1 space-x-2"
          :class="{
            'justify-end': isOwnMessage,
            'justify-start': !isOwnMessage
          }"
        >
          <span class="text-xs text-gray-400">
            {{ formatTime(message.createdAt) }}
          </span>
          
          <!-- Read indicators for own messages -->
          <div v-if="isOwnMessage" class="flex items-center space-x-1">
            <!-- Sent indicator -->
            <svg class="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            
            <!-- Read indicator -->
            <svg 
              v-if="message.readBy.length > 1" 
              class="w-3 h-3 text-blue-500" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
          </div>
        </div>
      </div>

      <!-- Avatar placeholder for own messages -->
      <div v-if="isOwnMessage && !selectionMode" class="w-8 flex-shrink-0"></div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { User, Message } from '../types/chat'

// Props
const props = defineProps<{
  message: Message
  currentUser: User | null
  showAvatar: boolean
  showTimestamp: boolean
  selectionMode?: boolean
  isSelected?: boolean
  conversationType?: 'direct' | 'group'
  isAdmin?: boolean 
}>()

// Emits
const emit = defineEmits<{
  'toggle-selection': [messageId: string]
}>()

// Computed
const isOwnMessage = computed(() => {
  return props.message.sender?.id === props.currentUser?.id
})

const isSystemMessage = computed(() => {
  return props.message.type === 'system' || props.message.sender === null
})

const canSelect = computed(() => {
  if (isSystemMessage.value) return false

  if (props.conversationType === 'direct') {
    return isOwnMessage.value
  }

  if (props.conversationType === 'group') {
    return props.isAdmin || isOwnMessage.value
  }

  return false
})


// Methods
const handleMessageClick = () => {
  if (props.selectionMode && canSelect.value) {
    emit('toggle-selection', props.message.id)
  }
}

const formatTime = (date: Date | string): string => {
  const messageDate = new Date(date)
  const now = new Date()
  
  // If today, show time
  if (messageDate.toDateString() === now.toDateString()) {
    return messageDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }
  
  // If yesterday
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (messageDate.toDateString() === yesterday.toDateString()) {
    return 'Yesterday ' + messageDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }
  
  // If this week
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  if (messageDate > weekAgo) {
    return messageDate.toLocaleDateString('en-US', { 
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }
  
  // Older messages
  return messageDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: messageDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}
</script>