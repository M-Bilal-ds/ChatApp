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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const chat_dto_1 = require("./dto/chat.dto");
let ChatController = class ChatController {
    chatService;
    constructor(chatService) {
        this.chatService = chatService;
    }
    async getUserConversations(req) {
        return this.chatService.getUserConversations(req.user.sub);
    }
    async createDirectConversation(req, createDirectDto) {
        return this.chatService.createDirectConversation(req.user.sub, createDirectDto);
    }
    async createGroupConversation(req, createGroupDto) {
        return this.chatService.createGroupConversation(req.user.sub, createGroupDto);
    }
    async getConversationMessages(req, conversationId, page, limit) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 50;
        return this.chatService.getConversationMessages(req.user.sub, conversationId, pageNum, limitNum);
    }
    async sendMessage(req, sendMessageDto) {
        return this.chatService.sendMessage(req.user.sub, sendMessageDto);
    }
    async searchUsers(req, searchDto) {
        return this.chatService.searchUsers(searchDto.query, req.user.sub);
    }
    async addParticipants(req, addParticipantsDto) {
        return this.chatService.addParticipants(req.user.sub, addParticipantsDto);
    }
    async markAsRead(req, markAsReadDto) {
        return this.chatService.markMessageAsRead(req.user.sub, markAsReadDto.conversationId, markAsReadDto.messageId);
    }
    async removeParticipants(req, removeParticipantsDto) {
        return this.chatService.removeParticipants(req.user.sub, removeParticipantsDto);
    }
    async deleteMessages(req, deleteMessagesDto) {
        return this.chatService.deleteMessages(req.user.sub, deleteMessagesDto);
    }
    async clearChat(req, conversationId) {
        return this.chatService.clearChat(req.user.sub, conversationId);
    }
    async updateGroup(req, updateGroupDto) {
        return this.chatService.updateGroup(req.user.sub, updateGroupDto);
    }
    async deleteConversation(req, conversationId) {
        return this.chatService.deleteConversation(req.user.sub, conversationId);
    }
    async getConversationDetails(req, conversationId) {
        return this.chatService.getConversationDetails(req.user.sub, conversationId);
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Get)('conversations'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getUserConversations", null);
__decorate([
    (0, common_1.Post)('conversations/direct'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, chat_dto_1.CreateDirectConversationDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createDirectConversation", null);
__decorate([
    (0, common_1.Post)('conversations/group'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, chat_dto_1.CreateGroupConversationDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createGroupConversation", null);
__decorate([
    (0, common_1.Get)('conversations/:id/messages'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getConversationMessages", null);
__decorate([
    (0, common_1.Post)('messages'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, chat_dto_1.SendMessageDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Get)('users/search'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, chat_dto_1.SearchUsersDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "searchUsers", null);
__decorate([
    (0, common_1.Post)('conversations/participants'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, chat_dto_1.AddParticipantsDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "addParticipants", null);
__decorate([
    (0, common_1.Post)('messages/read'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, chat_dto_1.MarkAsReadDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Delete)('conversations/participants'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, chat_dto_1.RemoveParticipantsDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "removeParticipants", null);
__decorate([
    (0, common_1.Delete)('messages'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, chat_dto_1.DeleteMessagesDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "deleteMessages", null);
__decorate([
    (0, common_1.Delete)('conversations/:id/clear'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "clearChat", null);
__decorate([
    (0, common_1.Patch)('conversations/group'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, chat_dto_1.UpdateGroupDto]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "updateGroup", null);
__decorate([
    (0, common_1.Delete)('conversations/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "deleteConversation", null);
__decorate([
    (0, common_1.Get)('conversations/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getConversationDetails", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)('chat'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map