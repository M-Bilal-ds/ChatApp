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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteConversationDto = exports.UpdateGroupDto = exports.ClearChatDto = exports.DeleteMessagesDto = exports.RemoveParticipantsDto = exports.MessageResponseDto = exports.ConversationResponseDto = exports.UserResponseDto = exports.MarkAsReadDto = exports.SearchUsersDto = exports.AddParticipantsDto = exports.SendMessageDto = exports.CreateGroupConversationDto = exports.CreateDirectConversationDto = void 0;
const class_validator_1 = require("class-validator");
class CreateDirectConversationDto {
    participantEmail;
}
exports.CreateDirectConversationDto = CreateDirectConversationDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateDirectConversationDto.prototype, "participantEmail", void 0);
class CreateGroupConversationDto {
    name;
    participantEmails;
    description;
}
exports.CreateGroupConversationDto = CreateGroupConversationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateGroupConversationDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEmail)({}, { each: true }),
    __metadata("design:type", Array)
], CreateGroupConversationDto.prototype, "participantEmails", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateGroupConversationDto.prototype, "description", void 0);
class SendMessageDto {
    conversationId;
    content;
    type;
    replyTo;
}
exports.SendMessageDto = SendMessageDto;
__decorate([
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "conversationId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['text', 'image', 'file']),
    __metadata("design:type", String)
], SendMessageDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsMongoId)(),
    __metadata("design:type", String)
], SendMessageDto.prototype, "replyTo", void 0);
class AddParticipantsDto {
    conversationId;
    participantEmails;
}
exports.AddParticipantsDto = AddParticipantsDto;
__decorate([
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AddParticipantsDto.prototype, "conversationId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEmail)({}, { each: true }),
    __metadata("design:type", Array)
], AddParticipantsDto.prototype, "participantEmails", void 0);
class SearchUsersDto {
    query;
}
exports.SearchUsersDto = SearchUsersDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SearchUsersDto.prototype, "query", void 0);
class MarkAsReadDto {
    conversationId;
    messageId;
}
exports.MarkAsReadDto = MarkAsReadDto;
__decorate([
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MarkAsReadDto.prototype, "conversationId", void 0);
__decorate([
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MarkAsReadDto.prototype, "messageId", void 0);
class UserResponseDto {
    id;
    email;
    username;
    isActive;
    lastLogin;
}
exports.UserResponseDto = UserResponseDto;
class ConversationResponseDto {
    id;
    name;
    type;
    participants;
    createdBy;
    lastMessage;
    lastActivity;
    description;
    avatar;
    unreadCount;
}
exports.ConversationResponseDto = ConversationResponseDto;
class MessageResponseDto {
    id;
    conversationId;
    sender;
    content;
    type;
    createdAt;
    edited;
    editedAt;
    readBy;
    replyTo;
}
exports.MessageResponseDto = MessageResponseDto;
class RemoveParticipantsDto {
    conversationId;
    participantIds;
}
exports.RemoveParticipantsDto = RemoveParticipantsDto;
__decorate([
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RemoveParticipantsDto.prototype, "conversationId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    __metadata("design:type", Array)
], RemoveParticipantsDto.prototype, "participantIds", void 0);
class DeleteMessagesDto {
    conversationId;
    messageIds;
}
exports.DeleteMessagesDto = DeleteMessagesDto;
__decorate([
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DeleteMessagesDto.prototype, "conversationId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsMongoId)({ each: true }),
    __metadata("design:type", Array)
], DeleteMessagesDto.prototype, "messageIds", void 0);
class ClearChatDto {
    conversationId;
}
exports.ClearChatDto = ClearChatDto;
__decorate([
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ClearChatDto.prototype, "conversationId", void 0);
class UpdateGroupDto {
    conversationId;
    name;
    description;
}
exports.UpdateGroupDto = UpdateGroupDto;
__decorate([
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateGroupDto.prototype, "conversationId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGroupDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateGroupDto.prototype, "description", void 0);
class DeleteConversationDto {
    conversationId;
}
exports.DeleteConversationDto = DeleteConversationDto;
__decorate([
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DeleteConversationDto.prototype, "conversationId", void 0);
//# sourceMappingURL=chat.dto.js.map