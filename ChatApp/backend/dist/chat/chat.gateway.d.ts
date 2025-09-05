import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';
interface AuthenticatedSocket extends Socket {
    userId?: string;
    userEmail?: string;
}
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private chatService;
    server: Server;
    private connectedUsers;
    constructor(jwtService: JwtService, chatService: ChatService);
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): void;
    handleSendMessage(client: AuthenticatedSocket, data: SendMessageDto): Promise<{
        success: boolean;
        message: import("./dto/chat.dto").MessageResponseDto;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    handleJoinConversation(client: AuthenticatedSocket, data: {
        conversationId: string;
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleLeaveConversation(client: AuthenticatedSocket, data: {
        conversationId: string;
    }): Promise<{
        success: boolean;
    }>;
    handleTypingStart(client: AuthenticatedSocket, data: {
        conversationId: string;
    }): Promise<void>;
    handleTypingStop(client: AuthenticatedSocket, data: {
        conversationId: string;
    }): Promise<void>;
    handleMarkAsRead(client: AuthenticatedSocket, data: {
        conversationId: string;
        messageId: string;
    }): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleDeleteMessage(client: AuthenticatedSocket, data: {
        conversationId: string;
        messageIds: string[];
    }): Promise<{
        deletedCount: number;
        skippedCount: number;
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    emitMessageDeleted(conversationId: string, messageIds: string[], deletedBy: string, result: {
        deletedCount: number;
        skippedCount: number;
    }): void;
    emitToUser(userId: string, event: string, data: any): void;
    emitToConversation(conversationId: string, event: string, data: any): void;
}
export {};
