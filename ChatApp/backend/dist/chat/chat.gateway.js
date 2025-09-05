"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
const chat_dto_1 = require("./dto/chat.dto");
let ChatGateway = class ChatGateway {
    jwtService;
    chatService;
    server;
    connectedUsers = new Map();
    constructor(jwtService, chatService) {
        this.jwtService = jwtService;
        this.chatService = chatService;
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ||
                client.handshake.query?.token;
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token);
            client.userId = payload.sub;
            client.userEmail = payload.email;
            this.connectedUsers.set(client.userId, client.id);
            const conversations = await this.chatService.getUserConversations(client.userId);
            conversations.forEach((conv) => {
                client.join(`conversation:${conv.id}`);
            });
            this.server.emit('user:online', {
                userId: client.userId,
                email: client.userEmail,
            });
            console.log(`User ${client.userEmail} connected`);
        }
        catch (error) {
            console.error('Connection error:', error);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        if (client.userId) {
            this.connectedUsers.delete(client.userId);
            this.server.emit('user:offline', {
                userId: client.userId,
                email: client.userEmail,
            });
            console.log(`User ${client.userEmail} disconnected`);
        }
    }
    async handleSendMessage(client, data) {
        try {
            const message = await this.chatService.sendMessage(client.userId, data);
            this.server
                .in(`conversation:${data.conversationId}`)
                .emit('message:new', message);
            return { success: true, message };
        }
        catch (error) {
            client.emit('error', { message: error.message });
            return { success: false, error: error.message };
        }
    }
    async handleJoinConversation(client, data) {
        try {
            await this.chatService.getConversationMessages(client.userId, data.conversationId, 1, 1);
            client.join(`conversation:${data.conversationId}`);
            return { success: true };
        }
        catch (error) {
            client.emit('error', { message: error.message });
            return { success: false, error: error.message };
        }
    }
    async handleLeaveConversation(client, data) {
        client.leave(`conversation:${data.conversationId}`);
        return { success: true };
    }
    async handleTypingStart(client, data) {
        client.to(`conversation:${data.conversationId}`).emit('typing:start:server', {
            userId: client.userId,
            userEmail: client.userEmail,
            conversationId: data.conversationId,
        });
    }
    async handleTypingStop(client, data) {
        client.to(`conversation:${data.conversationId}`).emit('typing:stop:server', {
            userId: client.userId,
            userEmail: client.userEmail,
            conversationId: data.conversationId,
        });
    }
    async handleMarkAsRead(client, data) {
        try {
            await this.chatService.markMessageAsRead(client.userId, data.conversationId, data.messageId);
            client.to(`conversation:${data.conversationId}`).emit('message:read:server', {
                messageId: data.messageId,
                userId: client.userId,
                readAt: new Date(),
            });
            return { success: true };
        }
        catch (error) {
            client.emit('error', { message: error.message });
            return { success: false, error: error.message };
        }
    }
    async handleDeleteMessage(client, data) {
        try {
            const result = await this.chatService.deleteMessages(client.userId, {
                conversationId: data.conversationId,
                messageIds: data.messageIds,
            });
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
        }
        catch (error) {
            client.emit('error', { message: error.message });
            return { success: false, error: error.message };
        }
    }
    emitMessageDeleted(conversationId, messageIds, deletedBy, result) {
        this.server
            .in(`conversation:${conversationId}`)
            .emit('message:deleted', {
            conversationId,
            messageIds,
            deletedBy,
            deletedCount: result.deletedCount,
            skippedCount: result.skippedCount,
        });
    }
    emitToUser(userId, event, data) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.server.to(socketId).emit(event, data);
        }
    }
    emitToConversation(conversationId, event, data) {
        this.server.in(`conversation:${conversationId}`).emit(event, data);
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('message:send'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, chat_dto_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('conversation:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('conversation:leave'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleLeaveConversation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing:start:client'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleTypingStart", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing:stop:client'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleTypingStop", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('message:read:client'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMarkAsRead", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('message:delete'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleDeleteMessage", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: 'http://localhost:5173',
            credentials: true,
        },
    }),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => chat_service_1.ChatService))),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        chat_service_1.ChatService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map