<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Sidebar -->
    <ChatSidebar
      :conversations="conversations"
      :currentUser="currentUser"
      :selectedConversation="selectedConversation"
      :onlineUsers="onlineUsers"
      @select-conversation="selectConversation"
      @create-direct-chat="showCreateDirectModal = true"
      @create-group-chat="showCreateGroupModal = true"
      @logout="handleLogout"
    />

    <!-- Main Chat Area -->
    <div class="flex-1 flex flex-col">
      <ChatWindow
  v-if="selectedConversation"
  :conversation="selectedConversation"
  :messages="messages"
  :currentUser="currentUser"
  :loading="messagesLoading"
  :typingUsers="typingUsersMap"
  :onlineUsers="onlineUsers"
  @send-message="sendMessage"
  @typing-start="handleTypingStart"
  @typing-stop="handleTypingStop"
  @add-participants="showAddParticipantsModal = true"
  @messages-updated="handleMessagesUpdated"
  @show-error="showError"
  @show-success="showSuccess"
  @conversation-updated="handleConversationUpdated"
  @conversation-deleted="handleConversationDeleted"
/>


      <!-- Empty state -->
      <div v-else class="flex-1 flex items-center justify-center bg-white">
        <div class="text-center text-gray-500">
          <div class="text-6xl mb-4">💬</div>
          <h2 class="text-xl font-semibold mb-2">Welcome to ChatApp</h2>
          <p>Select a conversation to start chatting</p>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <CreateDirectModal
      v-if="showCreateDirectModal"
      @close="showCreateDirectModal = false"
      @create="createDirectConversation"
    />

    <CreateGroupModal
      v-if="showCreateGroupModal"
      @close="showCreateGroupModal = false"
      @create="createGroupConversation"
    />

    <AddParticipantsModal
      v-if="showAddParticipantsModal && selectedConversation"
      :conversation="selectedConversation"
      @close="showAddParticipantsModal = false"
      @add="addParticipants"
    />

    <!-- Error Toast -->
    <div
      v-if="errorMessage"
      class="fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
    >
      {{ errorMessage }}
      <button @click="errorMessage = ''" class="ml-2 text-white hover:text-gray-200">×</button>
    </div>

    <!-- Success Toast -->
    <div
      v-if="successMessage"
      class="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
    >
      {{ successMessage }}
      <button @click="successMessage = ''" class="ml-2 text-white hover:text-gray-200">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { io, Socket } from 'socket.io-client'
import axios from 'axios'
import ChatSidebar from './ChatSidebar.vue'
import ChatWindow from './ChatWindow.vue'
import CreateDirectModal from './CreateDirectModal.vue'
import CreateGroupModal from './CreateGroupModal.vue'
import AddParticipantsModal from './AddParticipantsModal.vue'
import type { User, Conversation, Message, ConversationType } from '../types/chat'

/* -----------------------------
   Props / Emits
   ----------------------------- */
const props = defineProps<{ userData: any }>()
const emit = defineEmits<{ logout: [] }>()

/* -----------------------------
   State
   ----------------------------- */
const conversations = ref<Conversation[]>([])
const selectedConversation = ref<Conversation | null>(null)
const messages = ref<Message[]>([])
const currentUser = ref<User | null>(null)
const onlineUsers = ref<Set<string>>(new Set())
const typingUsers = ref<Map<string, string>>(new Map())
const typingUsersMap = computed(() => typingUsers.value)
const messagesLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Modals
const showCreateDirectModal = ref(false)
const showCreateGroupModal = ref(false)
const showAddParticipantsModal = ref(false)

let socket: Socket | null = null
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

/* -----------------------------
   Utility Functions
   ----------------------------- */
function showError(message: string) {
  errorMessage.value = message
  setTimeout(() => {
    errorMessage.value = ''
  }, 5000)
}

function showSuccess(message: string) {
  successMessage.value = message
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

function getAuthToken(): string | null {
  return localStorage.getItem('auth_token')
}

function getAuthHeaders() {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/* -----------------------------
   Normalizers
   ----------------------------- */
function normalizeUser(u: any): User {
  if (!u) return null as any
  
  // Handle both MongoDB ObjectId and string IDs
  const userId = u._id?.toString() || u.id?.toString() || ''
  
  return {
    id: userId,
    email: u.email ?? '',
    username: u.username ?? '',
    isActive: !!u.isActive,
    lastLogin: u.lastLogin ? new Date(u.lastLogin) : new Date(),
  }
}

function normalizeMessage(m: any): Message {
  if (!m) return null as any
  
  // Handle nested conversation ID
  let conversationId = ''
  if (m.conversationId) {
    conversationId = m.conversationId._id?.toString() || m.conversationId.toString() || ''
  } else if (m.conversation) {
    conversationId = m.conversation._id?.toString() || m.conversation.toString() || ''
  }
  
  return {
    id: (m._id?.toString() || m.id?.toString() || ''),
    conversationId,
    sender: m.sender ? normalizeUser(m.sender) : null,
    content: m.content ?? '',
    type: (m.type ?? 'text') as any,
    createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
    edited: !!m.edited,
    editedAt: m.editedAt ? new Date(m.editedAt) : undefined,
    readBy: (m.readBy ?? []).map((r: any) => ({
      user: (r.user?._id?.toString() || r.user?.toString() || ''),
      readAt: r.readAt ? new Date(r.readAt) : new Date(),
    })),
    replyTo: m.replyTo ? normalizeMessage(m.replyTo) : undefined,
  }
}

function normalizeConversation(c: any): Conversation {
  if (!c) return null as any
  
  const conversationId = c._id?.toString() || c.id?.toString() || ''
  const createdBy = c.createdBy?._id?.toString() || c.createdBy?.toString() || ''
  
  return {
    id: conversationId,
    name: c.name,
    type: (c.type as ConversationType) || (c.isGroup ? 'group' : 'direct'),
    participants: (c.participants ?? []).map(normalizeUser).filter(Boolean),
    createdBy,
    lastMessage: c.lastMessage ? normalizeMessage(c.lastMessage) : undefined,
    lastActivity: c.lastActivity ? new Date(c.lastActivity) : new Date(),
    description: c.description,
    avatar: c.avatar,
    unreadCount: c.unreadCount ?? 0,
  }
}

/* -----------------------------
   Lifecycle
   ----------------------------- */
onMounted(async () => {
  try {
    console.log('ChatInterface mounting with userData:', props.userData)
    
    // Initialize current user with better error handling
    const userData = props.userData
    if (!userData) {
      console.error('No userData provided to ChatInterface')
      showError('User data not provided')
      return
    }

    // Handle different userData structures
    let userId = ''
    let userEmail = ''
    let userName = ''

    if (userData.user) {
      // Format: { user: { id, email, username } }
      userId = userData.user.id?.toString() || userData.user._id?.toString() || ''
      userEmail = userData.user.email || ''
      userName = userData.user.username || ''
    } else {
      // Format: { id, email, username } or { _id, email, username }
      userId = userData.id?.toString() || userData._id?.toString() || ''
      userEmail = userData.email || ''
      userName = userData.username || ''
    }

    if (!userId || !userEmail) {
      console.error('Invalid user data structure:', userData)
      showError('Invalid user data structure')
      return
    }

    currentUser.value = {
      id: userId,
      email: userEmail,
      username: userName,
      isActive: true,
      lastLogin: new Date(),
    }

    console.log('Current user set to:', currentUser.value)

    await loadConversations()
    initializeSocket()
  } catch (error) {
    console.error('Failed to initialize chat:', error)
    showError('Failed to initialize chat application')
  }
})

// Add these two missing handlers to your ChatInterface.vue

function handleConversationDeleted() {
   console.log('handleConversationDeleted called')
  if (!selectedConversation.value) return
  
  const conversationId = selectedConversation.value.id
  
  // Leave socket room
  if (socket) {
    socket.emit('conversation:leave', { conversationId })
  }
  
  // Remove from conversations list
  const index = conversations.value.findIndex(c => c.id === conversationId)
  if (index !== -1) {
    conversations.value.splice(index, 1)
  }
  
  // Clear selection
  selectedConversation.value = null
  messages.value = []
}

function handleConversationUpdated(updatedConversation: Conversation) {
  // Update the selected conversation
  selectedConversation.value = updatedConversation
  
  // Update in conversations list
  const index = conversations.value.findIndex(c => c.id === updatedConversation.id)
  if (index !== -1) {
    conversations.value[index] = updatedConversation
  }
}

onUnmounted(() => {
  if (socket) {
    socket.disconnect()
  }
})

/* -----------------------------
   Socket
   ----------------------------- */
function initializeSocket() {
  try {
    const token = getAuthToken()
    if (!token) {
      showError('Authentication token not found')
      return
    }

    console.log('Initializing socket connection...')

    socket = io('http://localhost:3000', { 
      auth: { token },
      transports: ['websocket', 'polling']
    })

    socket.on('connect', () => {
      console.log('Connected to server, socket id=', socket?.id)
    })

    socket.on('connect_error', (error: unknown) => {
      console.error('Socket connection error:', error)
      showError('Failed to connect to chat server')
    })

    socket.on('message:new', (raw: any) => {
      try {
        console.log('Received new message:', raw)
        const message = normalizeMessage(raw)
        if (!message) return

        // Add to messages if it's for the current conversation
        if (selectedConversation.value?.id === message.conversationId) {
          messages.value.push(message)
          nextTick(() => {
            // Scroll to bottom or mark as read
            markMessageAsRead(message.id)
          })
        }

        // Update conversation list
        updateConversationWithNewMessage(message)
      } catch (error) {
        console.error('Error handling new message:', error)
      }
    })

    socket.on('user:online', ({ userId }: { userId: string }) => {
      if (userId) {
        onlineUsers.value = new Set([...onlineUsers.value, userId])
      }
    })

    socket.on('user:offline', ({ userId }: { userId: string }) => {
      if (userId) {
        const s = new Set(onlineUsers.value)
        s.delete(userId)
        onlineUsers.value = s
      }
    })

    socket.on('typing:start:server', ({ userId, conversationId }: { userId: string; conversationId: string }) => {
  if (selectedConversation.value?.id === conversationId && userId !== currentUser.value?.id) {
    const user = selectedConversation.value.participants.find(p => p.id === userId)
    if (user) {
      const newMap = new Map(typingUsers.value)
      newMap.set(conversationId, user.username)
      typingUsers.value = newMap
    }
  }
})

socket.on('typing:stop:server', ({ conversationId }: { conversationId: string }) => {
  const newMap = new Map(typingUsers.value)
  newMap.delete(conversationId)
  typingUsers.value = newMap
})

    socket.on('error', (err: any) => {
      console.error('Socket error:', err)
      showError('Chat server error occurred')
    })

    socket.on('disconnect', (reason: unknown) => {
      console.log('Disconnected from server:', reason)
      if (reason === 'io server disconnect') {
        // Server disconnected the client, try to reconnect
        socket?.connect()
      }
    })
  } catch (error) {
    console.error('Failed to initialize socket:', error)
    showError('Failed to initialize real-time chat')
  }
}

/* -----------------------------
   API Functions
   ----------------------------- */
async function loadConversations() {
  try {
    const token = getAuthToken()
    if (!token) {
      showError('Authentication required')
      return
    }

    if (!currentUser.value?.id) {
      console.error('Current user ID not available')
      showError('User ID not available')
      return
    }

    console.log('Loading conversations for user:', currentUser.value.id)

    const res = await axios.get(`${API_BASE_URL}/chat/conversations`, {
      headers: getAuthHeaders(),
      
    })

    if (res.data && Array.isArray(res.data)) {
      conversations.value = res.data.map(normalizeConversation).filter(Boolean)
      console.log('Loaded conversations:', conversations.value.length)
    } else {
      conversations.value = []
    }
  } catch (err: any) {
    console.error('Failed to load conversations:', err)
    console.error('Error response:', err.response?.data)
    
    if (err.response?.status === 401) {
      showError('Authentication expired. Please login again.')
      handleLogout()
    } else if (err.response?.status === 400) {
      showError('Invalid user data. Please try logging in again.')
      handleLogout()
    } else {
      showError('Failed to load conversations')
    }
  }
}

async function selectConversation(conv: Conversation) {
  try {
    if (!conv || selectedConversation.value?.id === conv.id) return

    console.log('Selecting conversation:', conv.id)

    // Join the conversation room
    if (socket) {
      socket.emit('conversation:join', { conversationId: conv.id })
    }

    selectedConversation.value = conv
    messagesLoading.value = true
    messages.value = []

    const token = getAuthToken()
    if (!token) {
      showError('Authentication required')
      return
    }

    const res = await axios.get(`${API_BASE_URL}/chat/conversations/${conv.id}/messages`, {
      headers: getAuthHeaders()
    })
    console.log('API response for messages:', res.data)

    if (res.data && Array.isArray(res.data)) {
      messages.value = res.data.map(normalizeMessage).filter(Boolean)
      console.log('Loaded messages:', messages.value.length)
    } else {
      messages.value = []
    }
  } catch (err: any) {
    console.error('Failed to load messages:', err)
    if (err?.response?.status === 403) {
      showError('You are not a participant in this conversation')
    } else if (err?.response?.status === 404) {
      showError('Conversation not found')
    } else {
      showError('Failed to load messages')
    }
  } finally {
    messagesLoading.value = false
  }
}

function sendMessage(content: string) {
  try {
    if (!selectedConversation.value || !content.trim() || !socket) {
      return
    }

    console.log('Sending message:', content)

    socket.emit('message:send', {
      conversationId: selectedConversation.value.id,
      content: content.trim(),
      type: 'text'
    })
  } catch (error) {
    console.error('Failed to send message:', error)
    showError('Failed to send message')
  }
}

function handleTypingStart() {
  try {
    if (selectedConversation.value && socket) {
      socket.emit('typing:start:client', { conversationId: selectedConversation.value.id })
    }
  } catch (error) {
    console.error('Failed to emit typing start:', error)
  }
}

function handleTypingStop() {
  try {
    if (selectedConversation.value && socket) {
      socket.emit('typing:stop:client', { conversationId: selectedConversation.value.id })
    }
  } catch (error) {
    console.error('Failed to emit typing stop:', error)
  }
}

async function handleMessagesUpdated() {
  if (selectedConversation.value) {
    await selectConversation(selectedConversation.value) // re-fetch messages
  }
}

/* -----------------------------
   Conversation Management
   ----------------------------- */
async function createDirectConversation(email: string) {
  try {
    if (!email || !email.trim()) {
      showError('Email is required')
      return
    }

    const token = getAuthToken()
    if (!token) {
      showError('Authentication required')
      return
    }

    const res = await axios.post(
      `${API_BASE_URL}/chat/conversations/direct`,
      { participantEmail: email.trim() },
      { headers: getAuthHeaders() }
    )

    if (res.data) {
      const newConv = normalizeConversation(res.data)
      
      // Ensure current user is in participants
      if (currentUser.value && !newConv.participants.some(p => p.id === currentUser.value?.id)) {
        newConv.participants.unshift(currentUser.value)
      }

      // Check if conversation already exists in list
      const existingIndex = conversations.value.findIndex(c => c.id === newConv.id)
      if (existingIndex !== -1) {
        conversations.value[existingIndex] = newConv
      } else {
        conversations.value.unshift(newConv)
      }

      await selectConversation(newConv)
      showCreateDirectModal.value = false
      showSuccess('Direct conversation created successfully')
    }
  } catch (err: any) {
    console.error('Failed to create direct conversation:', err)
    const errorMsg = err.response?.data?.message || 'Failed to create direct conversation'
    showError(errorMsg)
  }
}

async function createGroupConversation(data: { 
  name: string
  participantEmails: string[]
  description?: string 
}) {
  try {
    if (!data.name || !data.name.trim()) {
      showError('Group name is required')
      return
    }

    if (!data.participantEmails || data.participantEmails.length === 0) {
      showError('At least one participant email is required')
      return
    }

    const token = getAuthToken()
    if (!token) {
      showError('Authentication required')
      return
    }

    const payload = {
      name: data.name.trim(),
      participantEmails: data.participantEmails.map(email => email.trim()).filter(Boolean),
      description: data.description?.trim()
    }

    const res = await axios.post(
      `${API_BASE_URL}/chat/conversations/group`,
      payload,
      { headers: getAuthHeaders() }
    )

    if (res.data) {
      const newConv = normalizeConversation(res.data)
      
      // Ensure current user is in participants
      if (currentUser.value && !newConv.participants.some(p => p.id === currentUser.value?.id)) {
        newConv.participants.unshift(currentUser.value)
      }

      conversations.value.unshift(newConv)
      await selectConversation(newConv)
      showCreateGroupModal.value = false
      showSuccess('Group conversation created successfully')
    }
  } catch (err: any) {
    console.error('Failed to create group conversation:', err)
    const errorMsg = err.response?.data?.message || 'Failed to create group conversation'
    showError(errorMsg)
  }
}

async function addParticipants(participantEmails: string[]) {
  try {
    if (!selectedConversation.value) {
      showError('No conversation selected')
      return
    }

    if (!participantEmails || participantEmails.length === 0) {
      showError('At least one participant email is required')
      return
    }

    const token = getAuthToken()
    if (!token) {
      showError('Authentication required')
      return
    }

    const payload = {
      conversationId: selectedConversation.value.id,
      participantEmails: participantEmails.map(email => email.trim()).filter(Boolean)
    }

    const res = await axios.post(
      `${API_BASE_URL}/chat/conversations/participants`,
      payload,
      { headers: getAuthHeaders() }
    )

    if (res.data) {
      const updated = normalizeConversation(res.data)
      selectedConversation.value = updated
      
      const idx = conversations.value.findIndex(c => c.id === updated.id)
      if (idx !== -1) {
        conversations.value[idx] = updated
      }
      
      showAddParticipantsModal.value = false
      showSuccess('Participants added successfully')
    }
  } catch (err: any) {
    console.error('Failed to add participants:', err)
    const errorMsg = err.response?.data?.message || 'Failed to add participants'
    showError(errorMsg)
  }
}

/* -----------------------------
   Helper Functions
   ----------------------------- */
function updateConversationWithNewMessage(message: Message) {
  try {
    const convIndex = conversations.value.findIndex(c => c.id === message.conversationId)
    if (convIndex !== -1) {
      const conv = { ...conversations.value[convIndex] }
      conv.lastMessage = message
      conv.lastActivity = message.createdAt
      
      // Move to top of list
      conversations.value.splice(convIndex, 1)
      conversations.value.unshift(conv)
    }
  } catch (error) {
    console.error('Error updating conversation with new message:', error)
  }
}

async function markMessageAsRead(messageId: string) {
  try {
    if (!selectedConversation.value || !currentUser.value) return

    const token = getAuthToken()
    if (!token) return

    // Use the correct API endpoint from your backend
    await axios.post(
      `${API_BASE_URL}/chat/messages/read`,
      {
        conversationId: selectedConversation.value.id,
        messageId: messageId
      },
      { headers: getAuthHeaders() }
    )
  } catch (error) {
    // Silently fail for read receipts
    console.error('Failed to mark message as read:', error)
  }
}

/* -----------------------------
   Logout
   ----------------------------- */
function handleLogout() {
  try {
    localStorage.removeItem('auth_token')
    if (socket) {
      socket.disconnect()
    }
    emit('logout')
  } catch (error) {
    console.error('Error during logout:', error)
  }

  
}
</script>

<style scoped>
/* Add any additional styles here */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>