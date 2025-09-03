export interface User {
  id: string
  email: string
  username: string
  isActive: boolean
  lastLogin: Date
}

export interface Conversation {
  id: string
  name: string
  type: 'direct' | 'group'
  participants: User[]
  createdBy: string
  lastMessage?: Message
  lastActivity: Date
  description?: string
  avatar?: string
  unreadCount?: number
}

export interface Message {
  id: string
  conversationId: string
  sender: User | null
  content: string
  type: 'text' | 'image' | 'file' | 'system'
  createdAt: Date
  edited: boolean
  editedAt?: Date
  readBy: { user: string; readAt: Date }[]
  replyTo?: Message
  isSystemMessage?: boolean
}

export interface CreateDirectConversationDto {
  participantEmail: string
}

export interface CreateGroupConversationDto {
  name: string
  participantEmails: string[]
  description?: string
}

export interface SendMessageDto {
  conversationId: string
  content: string
  type?: string
  replyTo?: string
}

export interface SocketEvents {
  // Client to server
  'message:send': SendMessageDto
  'conversation:join': { conversationId: string }
  'conversation:leave': { conversationId: string }
  'typing:start:client': { conversationId: string }
  'typing:stop:client': { conversationId: string }
  'message:read:client': { conversationId: string; messageId: string }

  // Server to client
  'message:new': Message
  'user:online': { userId: string; email: string }
  'user:offline': { userId: string; email: string }
  'typing:start:server': { userId: string; userEmail: string; conversationId: string }
  'typing:stop:server': { userId: string; userEmail: string; conversationId: string }
  'message:read:server': { messageId: string; userId: string; readAt: Date }
  'error': { message: string }
}

// filepath: /home/bilal/Nest.js/ChatApp/frontend/src/types/chat.ts
export type ConversationType = 'direct' | 'group'