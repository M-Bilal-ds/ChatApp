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
          
          <div class="relative">
            <button
              @click="showOptionsMenu = !showOptionsMenu"
              class="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg hover:cursor-pointer transition-colors"
              title="More options"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
              </svg>
            </button>
            
            <!-- Options Menu Component -->
            <ChatOptionsMenu
  :conversation="conversation"
  :currentUser="currentUser"
  :isOpen="showOptionsMenu"
  @close="handleOptionsMenuClose"
  @clear-chat="handleClearChat"
  @remove-participants="handleRemoveParticipants"
  @update-group="handleUpdateGroup"
  @delete-conversation="handleDeleteConversation"
  @toggle-message-selection="toggleMessageSelection"
/>
          </div>
        </div>
      </div>
    </div>

    <!-- Message Selection Bar -->
    <div v-if="messageSelectionMode" class="bg-blue-50 border-b border-blue-200 p-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <button
  @click.stop.prevent="toggleMessageSelection()"
  class="text-blue-600 hover:text-blue-800"
>
  <svg class="w-5 h-5 hover:cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
</button>

          <span class="text-blue-800 font-medium">
            {{ selectedMessages.length }} message{{ selectedMessages.length !== 1 ? 's' : '' }} selected
          </span>
        </div>
        
        <div class="flex items-center space-x-2">
          <button
            v-if="selectedMessages.length > 0"
            @click="selectAllMessages"
            class="px-3 py-1 hover:cursor-pointer text-sm text-blue-600 hover:text-blue-800"
          >
            Select All
          </button>
          <button
            v-if="selectedMessages.length > 0"
            @click="deleteSelectedMessages"
            class="px-3 py-1 hover:cursor-pointer bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Delete Selected
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
          :selectionMode="messageSelectionMode"
          :isSelected="selectedMessages.includes(message.id)"
          :isAdmin="isGroupAdmin"
          :conversationType="conversation.type"
          @toggle-selection="toggleMessageSelection(message.id)"
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
    <div v-if="!messageSelectionMode" class="p-4 border-t border-gray-200 bg-white">
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
import { ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import MessageItem from './MessageItem.vue'
import ChatOptionsMenu from './ChatOptionsMenu.vue'
import { chatApi } from '../services/api'
import type { Conversation, Message, User, MessageDeletedData } from '../types/chat'
import { inject, computed } from 'vue'

const socket = inject('socket') as any
// Props
const props = defineProps<{
  conversation: Conversation
  messages: Message[]
  currentUser: User | null
  loading: boolean
  typingUsers: Map<string, string>
  onlineUsers?: Set<string>
}>()

const isGroupAdmin = computed(() => {
  if (props.conversation.type !== 'group') return false
  if (!props.currentUser) return false
  return props.conversation.createdBy === props.currentUser.id
})

// Emits
const emit = defineEmits<{
  'send-message': [content: string]
  'typing-start': []
  'typing-stop': []
  'add-participants': []
  'show-error': [message: string]
  'show-success': [message: string]
  'conversation-updated': [conversation: Conversation]
  'conversation-deleted': []
  'messages-updated': []
}>()

// State
const messageText = ref('')
const messagesContainer = ref<HTMLElement>()
const messageInput = ref<HTMLTextAreaElement>()
const showOptionsMenu = ref(false)
const messageSelectionMode = ref(false)
const selectedMessages = ref<string[]>([])




let typingTimeout: ReturnType<typeof setTimeout> | null = null
let isTyping = false

// Watch for new messages and scroll to bottom
watch(() => props.messages.length, () => {
  nextTick(() => scrollToBottom())
}, { immediate: true })

// Watch for conversation changes
watch(() => props.conversation.id, () => {
  messageText.value = ''
  messageSelectionMode.value = false
  selectedMessages.value = []
  showOptionsMenu.value = false
  nextTick(() => {
    scrollToBottom()
    messageInput.value?.focus()
  })
})

onMounted(() => {
  messageInput.value?.focus()
  socket?.on('message:deleted', (data: MessageDeletedData) => {
    console.log('Received message deletion event:', data)
    
    // Remove deleted messages from local state immediately
    const messagesToRemove = data.messageIds
    props.messages.splice(0, props.messages.length, 
      ...props.messages.filter(m => !messagesToRemove.includes(m.id))
    )
    
    // If we're in selection mode and deleted messages were selected, remove them from selection
    if (messageSelectionMode.value) {
      selectedMessages.value = selectedMessages.value.filter(id => !messagesToRemove.includes(id))
    }
    
    // Show notification if someone else deleted messages
    if (data.deletedBy !== props.currentUser?.id) {
      emit('show-success', `${data.deletedCount} message(s) were deleted`)
    }
  })
})

// Clean up in onUnmounted
onUnmounted(() => {
  socket?.off('message:deleted')
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


// Options menu handlers
const handleClearChat = async () => {
  try {
    const result = await chatApi.clearChat(props.conversation.id)
    emit('show-success', `Cleared ${result.clearedCount} messages`)
    emit('messages-updated')
  } catch (error: any) {
    console.error('Failed to clear chat:', error)
    emit('show-error', error.response?.data?.message || 'Failed to clear chat')
  }
}

const handleOptionsMenuClose = () => {
  console.log('handleOptionsMenuClose called')
  showOptionsMenu.value = false
}

const handleRemoveParticipants = async (participantIds: string[]) => {
  try {
    const updatedConversation = await chatApi.removeParticipants(props.conversation.id, participantIds)
    emit('show-success', `Removed ${participantIds.length} participant(s)`)
    emit('conversation-updated', updatedConversation)
  } catch (error: any) {
    console.error('Failed to remove participants:', error)
    emit('show-error', error.response?.data?.message || 'Failed to remove participants')
  }
}

const handleUpdateGroup = async (name: string, description?: string) => {
  try {
    const updatedConversation = await chatApi.updateGroup(props.conversation.id, name, description)
    emit('show-success', 'Group information updated successfully')
    emit('conversation-updated', updatedConversation)
  } catch (error: any) {
    console.error('Failed to update group:', error)
    emit('show-error', error.response?.data?.message || 'Failed to update group')
  }
}

const handleDeleteConversation = async () => {
  console.log('handleDeleteConversation called')
  try {
    const result = await chatApi.deleteConversation(props.conversation.id)
    
    if (result.reassigned) {
      // Admin was reassigned, update the conversation instead of deleting
      emit('show-success', result.message + '. Admin has been reassigned.')
      if (result.updatedConversation) {
        emit('conversation-updated', result.updatedConversation)
      }
    } else {
      // Conversation was deleted or user left without reassignment
      const actionText = props.conversation.type === 'group' ? 'Left group' : 'Deleted conversation'
      emit('show-success', actionText + ' successfully')
      emit('conversation-deleted')
    }
  } catch (error: any) {
    console.error('Failed to delete conversation:', error)
    emit('show-error', error.response?.data?.message || 'Failed to delete conversation')
  }
}

// Message selection handlers
const toggleMessageSelection = (messageId?: string) => {
  if (messageId) {
    const index = selectedMessages.value.indexOf(messageId)
    if (index > -1) {
      selectedMessages.value.splice(index, 1)
    } else {
      const message = props.messages.find(m => m.id === messageId)
      if (!message) return

      if (props.conversation.type === 'direct') {
        if (message.sender?.id === props.currentUser?.id) {
          selectedMessages.value.push(messageId)
        }
      } else if (props.conversation.type === 'group') {
        if (isGroupAdmin.value || message.sender?.id === props.currentUser?.id) {
          selectedMessages.value.push(messageId)
        }
      }
    }
  } else {
    messageSelectionMode.value = !messageSelectionMode.value
    selectedMessages.value = []
    showOptionsMenu.value = false
  }
}



const selectAllMessages = () => {
  // Select all user's own messages (or all messages in direct chat)
  const selectableMessages = props.messages.filter(message => 
    props.conversation.type === 'direct' || message.sender?.id === props.currentUser?.id
  )
  selectedMessages.value = selectableMessages.map(m => m.id)
}

const deleteSelectedMessages = async () => {
  if (selectedMessages.value.length === 0) return
  
  try {
    const result = await chatApi.deleteMessages(props.conversation.id, selectedMessages.value)
    const deletedCount = result.deletedCount
    const skippedCount = result.skippedCount
    
    let message = `Deleted ${deletedCount} message(s)`
    if (skippedCount > 0) {
      message += ` (${skippedCount} message(s) could not be deleted)`
    }
    
    emit('show-success', message)
    
    // Remove deleted messages from local state immediately to prevent double-deletion
    const messagesToDelete = selectedMessages.value
    props.messages.splice(0, props.messages.length, ...props.messages.filter(m => !messagesToDelete.includes(m.id)))
    
    // Exit selection mode
    messageSelectionMode.value = false
    selectedMessages.value = []
    
    // Then refresh from server to ensure consistency
    emit('messages-updated')
  } catch (error: any) {
    console.error('Failed to delete messages:', error)
    emit('show-error', error.response?.data?.message || 'Failed to delete messages')
  }
}

// Existing methods
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