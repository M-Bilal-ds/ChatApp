import axios from 'axios'
import type { 
  User, 
  Conversation, 
  Message, 
  CreateDirectConversationDto, 
  CreateGroupConversationDto,
  SendMessageDto 
} from '../types/chat'

const API_BASE_URL = 'http://localhost:3000/api'

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

// Request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.reload()
    }
    return Promise.reject(error)
  }
)

export const chatApi = {
  // Conversations
  async getConversations(): Promise<Conversation[]> {
    const response = await apiClient.get('/chat/conversations')
    return response.data
  },

  async createDirectConversation(data: CreateDirectConversationDto): Promise<Conversation> {
    const response = await apiClient.post('/chat/conversations/direct', data)
    return response.data
  },

  async createGroupConversation(data: CreateGroupConversationDto): Promise<Conversation> {
    const response = await apiClient.post('/chat/conversations/group', data)
    return response.data
  },

  // Messages
  async getMessages(conversationId: string, page = 1, limit = 50): Promise<Message[]> {
    const response = await apiClient.get(`/chat/conversations/${conversationId}/messages`, {
      params: { page, limit }
    })
    return response.data
  },

  async sendMessage(data: SendMessageDto): Promise<Message> {
    const response = await apiClient.post('/chat/messages', data)
    return response.data
  },

  // Users
  async searchUsers(query: string): Promise<User[]> {
    const response = await apiClient.get('/chat/users/search', {
      params: { query }
    })
    return response.data
  },

  // Participants
  async addParticipants(conversationId: string, participantEmails: string[]): Promise<Conversation> {
    const response = await apiClient.post('/chat/conversations/participants', {
      conversationId,
      participantEmails
    })
    return response.data
  },

  // Read status - FIXED: Use correct endpoint
  async markAsRead(conversationId: string, messageId: string): Promise<void> {
    await apiClient.post('/chat/messages/read', {
      conversationId,
      messageId
    })
  }
}

export default apiClient