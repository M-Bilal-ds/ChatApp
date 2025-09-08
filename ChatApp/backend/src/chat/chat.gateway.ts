import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { forwardRef, Inject } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
}

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    @Inject(forwardRef(() => ChatService))
    private chatService: ChatService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.query?.token as string);

      if (!token) {
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.userEmail = payload.email;

      // Store connection
      this.connectedUsers.set(client.userId!, client.id);

      // Join user to their conversations
      const conversations = await this.chatService.getUserConversations(
        client.userId!,
      );
      conversations.forEach((conv) => {
        client.join(`conversation:${conv.id}`);
      });

      // Notify others that user is online
      this.server.emit('user:online', {
        userId: client.userId,
        email: client.userEmail,
      });

      console.log(`User ${client.userEmail} connected`);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);

      // Notify others that user is offline
      this.server.emit('user:offline', {
        userId: client.userId,
        email: client.userEmail,
      });

      console.log(`User ${client.userEmail} disconnected`);
    }
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: SendMessageDto,
  ) {
    try {
      const message = await this.chatService.sendMessage(client.userId!, data);

      // Emit to all participants in the conversation
      this.server
        .in(`conversation:${data.conversationId}`)
        .emit('message:new', message);

      return { success: true, message };
    } catch (error) {
      client.emit('error', { message: error.message });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('conversation:join')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    try {
      // Verify user is participant
      await this.chatService.getConversationMessages(
        client.userId!,
        data.conversationId,
        1,
        1,
      );

      client.join(`conversation:${data.conversationId}`);

      return { success: true };
    } catch (error) {
      client.emit('error', { message: error.message });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('online:users:request')
  handleOnlineUsersRequest(@ConnectedSocket() client: AuthenticatedSocket) {
    // Return all currently online user IDs
    const onlineUserIds = Array.from(this.connectedUsers.keys());
    client.emit('online:users:list', { userIds: onlineUserIds });
  }

  @SubscribeMessage('conversation:leave')
  async handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
    return { success: true };
  }

  @SubscribeMessage('message:read:client')
async handleMessageRead(
  @ConnectedSocket() client: AuthenticatedSocket,
  @MessageBody() data: { conversationId: string; messageId: string },
) {
  // Update message read status in DB
  await this.chatService.markMessageAsRead(client.userId!, data.conversationId, data.messageId)
  // Notify all participants
  this.server
    .in(`conversation:${data.conversationId}`)
    .emit('message:read:server', {
      messageId: data.messageId,
      userId: client.userId,
      readAt: new Date(),
    })
}

  @SubscribeMessage('typing:start:client')
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client
      .to(`conversation:${data.conversationId}`)
      .emit('typing:start:server', {
        userId: client.userId,
        userEmail: client.userEmail,
        conversationId: data.conversationId,
      });
  }

  @SubscribeMessage('typing:stop:client')
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client
      .to(`conversation:${data.conversationId}`)
      .emit('typing:stop:server', {
        userId: client.userId,
        userEmail: client.userEmail,
        conversationId: data.conversationId,
      });
  }

  @SubscribeMessage('message:read:client')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; messageId: string },
  ) {
    try {
      await this.chatService.markMessageAsRead(
        client.userId!,
        data.conversationId,
        data.messageId,
      );

      // Notify other participants
      client
        .to(`conversation:${data.conversationId}`)
        .emit('message:read:server', {
          messageId: data.messageId,
          userId: client.userId,
          readAt: new Date(),
        });

      return { success: true };
    } catch (error) {
      client.emit('error', { message: error.message });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('message:delete')
  async handleDeleteMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; messageIds: string[] },
  ) {
    try {
      const result = await this.chatService.deleteMessages(client.userId!, {
        conversationId: data.conversationId,
        messageIds: data.messageIds,
      });

      // Emit deletion event to ALL participants in the conversation
      this.server
        .in(`conversation:${data.conversationId}`)
        .emit('message:deleted', {
          conversationId: data.conversationId,
          messageIds: data.messageIds,
          deletedBy: client.userId,
          deletedCount: result.deletedCount,
          skippedCount: result.skippedCount,
        });

      return { success: true, ...result };
    } catch (error) {
      client.emit('error', { message: error.message });
      return { success: false, error: error.message };
    }
  }

  // Emit deletion events when messages are deleted via REST API
  emitMessageDeleted(
    conversationId: string,
    messageIds: string[],
    deletedBy: string,
    result: { deletedCount: number; skippedCount: number },
  ) {
    this.server.in(`conversation:${conversationId}`).emit('message:deleted', {
      conversationId,
      messageIds,
      deletedBy,
      deletedCount: result.deletedCount,
      skippedCount: result.skippedCount,
    });
  }

  emitToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }

  emitToConversation(conversationId: string, event: string, data: any) {
    this.server.in(`conversation:${conversationId}`).emit(event, data);
  }
}
