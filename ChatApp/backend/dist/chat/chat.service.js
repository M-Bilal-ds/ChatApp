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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const chat_schema_1 = require("../schemas/chat.schema");
const chat_schema_2 = require("../schemas/chat.schema");
const user_schema_1 = require("../schemas/user.schema");
const common_2 = require("@nestjs/common");
const chat_gateway_1 = require("./chat.gateway");
let ChatService = class ChatService {
    conversationModel;
    messageModel;
    userModel;
    chatGateway;
    constructor(conversationModel, messageModel, userModel, chatGateway) {
        this.conversationModel = conversationModel;
        this.messageModel = messageModel;
        this.userModel = userModel;
        this.chatGateway = chatGateway;
    }
    async createDirectConversation(userId, createDirectDto) {
        try {
            const { participantEmail } = createDirectDto;
            if (!participantEmail || !participantEmail.trim()) {
                throw new common_1.BadRequestException('Participant email is required');
            }
            if (!mongoose_2.Types.ObjectId.isValid(userId)) {
                throw new common_1.BadRequestException('Invalid user ID');
            }
            const participant = await this.userModel.findOne({
                email: participantEmail.trim().toLowerCase()
            });
            if (!participant) {
                throw new common_1.NotFoundException('User not found with that email');
            }
            if (participant._id.toString() === userId) {
                throw new common_1.BadRequestException('Cannot create conversation with yourself');
            }
            const existingConversation = await this.conversationModel
                .findOne({
                type: 'direct',
                participants: { $all: [userId, participant._id], $size: 2 },
            })
                .populate('participants', 'email username isActive lastLogin')
                .populate({
                path: 'lastMessage',
                populate: { path: 'sender', select: 'email username' },
            });
            if (existingConversation) {
                return this.formatConversationResponse(existingConversation);
            }
            const conversation = new this.conversationModel({
                name: `${participant.username}`,
                participants: [new mongoose_2.Types.ObjectId(userId), participant._id],
                createdBy: new mongoose_2.Types.ObjectId(userId),
                type: 'direct',
                lastActivity: new Date(),
            });
            const savedConversation = await conversation.save();
            const populatedConversation = await this.conversationModel
                .findById(savedConversation._id)
                .populate('participants', 'email username isActive lastLogin')
                .populate({
                path: 'lastMessage',
                populate: { path: 'sender', select: 'email username' },
            });
            if (!populatedConversation) {
                throw new common_1.InternalServerErrorException('Failed to retrieve created conversation');
            }
            return this.formatConversationResponse(populatedConversation, userId);
        }
        catch (error) {
            console.error('Error creating direct conversation:', error);
            if (error instanceof common_1.BadRequestException ||
                error instanceof common_1.NotFoundException ||
                error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to create direct conversation');
        }
    }
    async createGroupConversation(userId, createGroupDto) {
        try {
            const { name, participantEmails, description } = createGroupDto;
            if (!name || !name.trim()) {
                throw new common_1.BadRequestException('Group name is required');
            }
            if (!participantEmails || participantEmails.length === 0) {
                throw new common_1.BadRequestException('At least one participant email is required');
            }
            if (!mongoose_2.Types.ObjectId.isValid(userId)) {
                throw new common_1.BadRequestException('Invalid user ID');
            }
            const cleanEmails = participantEmails
                .map(email => email.trim().toLowerCase())
                .filter(email => email.length > 0);
            if (cleanEmails.length === 0) {
                throw new common_1.BadRequestException('Valid participant emails are required');
            }
            const participants = await this.userModel.find({
                email: { $in: cleanEmails },
            });
            if (participants.length !== cleanEmails.length) {
                const foundEmails = participants.map(p => p.email);
                const notFound = cleanEmails.filter(email => !foundEmails.includes(email));
                throw new common_1.NotFoundException(`Users not found: ${notFound.join(', ')}`);
            }
            const participantIds = participants.map((p) => p._id);
            if (!participantIds.some((id) => id.toString() === userId)) {
                participantIds.push(new mongoose_2.Types.ObjectId(userId));
            }
            const conversation = new this.conversationModel({
                name: name.trim(),
                participants: participantIds,
                createdBy: new mongoose_2.Types.ObjectId(userId),
                type: 'group',
                description: description?.trim() || undefined,
                lastActivity: new Date(),
            });
            const savedConversation = await conversation.save();
            const populatedConversation = await this.conversationModel
                .findById(savedConversation._id)
                .populate('participants', 'email username isActive lastLogin')
                .populate({
                path: 'lastMessage',
                populate: { path: 'sender', select: 'email username' },
            });
            if (!populatedConversation) {
                throw new common_1.InternalServerErrorException('Failed to retrieve created conversation');
            }
            await this.createSystemMessage(savedConversation._id.toString(), `Group "${name.trim()}" was created`);
            return this.formatConversationResponse(populatedConversation, userId);
        }
        catch (error) {
            console.error('Error creating group conversation:', error);
            if (error instanceof common_1.BadRequestException ||
                error instanceof common_1.NotFoundException ||
                error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to create group conversation');
        }
    }
    async getUserConversations(userId) {
        try {
            if (!mongoose_2.Types.ObjectId.isValid(userId)) {
                throw new common_1.BadRequestException('Invalid user ID');
            }
            const conversations = await this.conversationModel
                .find({ participants: new mongoose_2.Types.ObjectId(userId) })
                .populate('participants', 'email username isActive lastLogin')
                .populate({
                path: 'lastMessage',
                populate: { path: 'sender', select: 'email username' },
            })
                .sort({ lastActivity: -1 });
            return conversations.map((conv) => this.formatConversationResponse(conv, userId));
        }
        catch (error) {
            console.error('Error getting user conversations:', error);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to load conversations');
        }
    }
    async sendMessage(userId, sendMessageDto) {
        try {
            const { conversationId, content, type = 'text', replyTo } = sendMessageDto;
            if (!content || !content.trim()) {
                throw new common_1.BadRequestException('Message content is required');
            }
            if (!mongoose_2.Types.ObjectId.isValid(conversationId)) {
                throw new common_1.BadRequestException('Invalid conversation ID');
            }
            if (!mongoose_2.Types.ObjectId.isValid(userId)) {
                throw new common_1.BadRequestException('Invalid user ID');
            }
            const conversation = await this.conversationModel.findById(conversationId);
            if (!conversation) {
                throw new common_1.NotFoundException('Conversation not found');
            }
            if (!conversation.participants.some((p) => p.toString() === userId)) {
                throw new common_1.ForbiddenException('You are not a participant in this conversation');
            }
            if (replyTo && !mongoose_2.Types.ObjectId.isValid(replyTo)) {
                throw new common_1.BadRequestException('Invalid reply message ID');
            }
            const message = new this.messageModel({
                conversationId: new mongoose_2.Types.ObjectId(conversationId),
                sender: new mongoose_2.Types.ObjectId(userId),
                content: content.trim(),
                type,
                replyTo: replyTo ? new mongoose_2.Types.ObjectId(replyTo) : undefined,
                createdAt: new Date(),
            });
            const savedMessage = await message.save();
            await this.conversationModel.findByIdAndUpdate(conversationId, {
                lastMessage: savedMessage._id,
                lastActivity: new Date(),
            });
            const populatedMessage = await this.messageModel
                .findById(savedMessage._id)
                .populate('sender', 'email username')
                .populate({
                path: 'replyTo',
                populate: { path: 'sender', select: 'email username' },
            });
            if (!populatedMessage) {
                throw new common_1.InternalServerErrorException('Failed to retrieve sent message');
            }
            return this.formatMessageResponse(populatedMessage);
        }
        catch (error) {
            console.error('Error sending message:', error);
            if (error instanceof common_1.BadRequestException ||
                error instanceof common_1.NotFoundException ||
                error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to send message');
        }
    }
    async getConversationMessages(userId, conversationId, page = 1, limit = 50) {
        try {
            if (!mongoose_2.Types.ObjectId.isValid(conversationId)) {
                throw new common_1.BadRequestException('Invalid conversation ID');
            }
            if (!mongoose_2.Types.ObjectId.isValid(userId)) {
                throw new common_1.BadRequestException('Invalid user ID');
            }
            const conversation = await this.conversationModel.findById(conversationId);
            if (!conversation) {
                throw new common_1.NotFoundException('Conversation not found');
            }
            if (!conversation.participants.some((p) => p.toString() === userId)) {
                throw new common_1.ForbiddenException('You are not a participant in this conversation');
            }
            const skip = Math.max(0, (page - 1) * limit);
            const validLimit = Math.min(Math.max(1, limit), 100);
            const messages = await this.messageModel
                .find({ conversationId: new mongoose_2.Types.ObjectId(conversationId) })
                .populate('sender', 'email username')
                .populate({
                path: 'replyTo',
                populate: { path: 'sender', select: 'email username' },
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(validLimit);
            return messages.reverse().map((msg) => this.formatMessageResponse(msg));
        }
        catch (error) {
            console.error('Error getting conversation messages:', error);
            if (error instanceof common_1.BadRequestException ||
                error instanceof common_1.NotFoundException ||
                error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to load messages');
        }
    }
    async searchUsers(query, currentUserId) {
        try {
            if (!query || !query.trim()) {
                return [];
            }
            if (!mongoose_2.Types.ObjectId.isValid(currentUserId)) {
                throw new common_1.BadRequestException('Invalid user ID');
            }
            const searchQuery = query.trim();
            const users = await this.userModel
                .find({
                $and: [
                    { _id: { $ne: currentUserId } },
                    {
                        $or: [
                            { username: { $regex: searchQuery, $options: 'i' } },
                            { email: { $regex: searchQuery, $options: 'i' } },
                        ],
                    },
                ],
            })
                .select('email username isActive lastLogin')
                .limit(20);
            return users.map((user) => this.formatUserResponse(user));
        }
        catch (error) {
            console.error('Error searching users:', error);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to search users');
        }
    }
    async addParticipants(userId, addParticipantsDto) {
        try {
            const { conversationId, participantEmails } = addParticipantsDto;
            if (!mongoose_2.Types.ObjectId.isValid(conversationId)) {
                throw new common_1.BadRequestException('Invalid conversation ID');
            }
            if (!mongoose_2.Types.ObjectId.isValid(userId)) {
                throw new common_1.BadRequestException('Invalid user ID');
            }
            if (!participantEmails || participantEmails.length === 0) {
                throw new common_1.BadRequestException('At least one participant email is required');
            }
            const conversation = await this.conversationModel.findById(conversationId);
            if (!conversation) {
                throw new common_1.NotFoundException('Conversation not found');
            }
            if (conversation.type !== 'group') {
                throw new common_1.BadRequestException('Can only add participants to group conversations');
            }
            if (!conversation.participants.some((p) => p.toString() === userId)) {
                throw new common_1.ForbiddenException('You are not a participant in this conversation');
            }
            const cleanEmails = participantEmails
                .map(email => email.trim().toLowerCase())
                .filter(email => email.length > 0);
            if (cleanEmails.length === 0) {
                throw new common_1.BadRequestException('Valid participant emails are required');
            }
            const newParticipants = await this.userModel.find({
                email: { $in: cleanEmails },
            });
            if (newParticipants.length !== cleanEmails.length) {
                const foundEmails = newParticipants.map(p => p.email);
                const notFound = cleanEmails.filter(email => !foundEmails.includes(email));
                throw new common_1.NotFoundException(`Users not found: ${notFound.join(', ')}`);
            }
            const newParticipantIds = newParticipants
                .map((p) => p._id)
                .filter((id) => !conversation.participants.some((existingId) => existingId.toString() === id.toString()));
            if (newParticipantIds.length === 0) {
                throw new common_1.BadRequestException('All users are already participants');
            }
            conversation.participants.push(...newParticipantIds);
            conversation.lastActivity = new Date();
            await conversation.save();
            const addedUsernames = newParticipants
                .filter((p) => newParticipantIds.some((id) => id.toString() === p._id.toString()))
                .map((p) => p.username);
            await this.createSystemMessage(conversationId, `${addedUsernames.join(', ')} ${addedUsernames.length === 1 ? 'was' : 'were'} added to the group`);
            const updatedConversation = await this.conversationModel
                .findById(conversationId)
                .populate('participants', 'email username isActive lastLogin')
                .populate({
                path: 'lastMessage',
                populate: { path: 'sender', select: 'email username' },
            });
            if (!updatedConversation) {
                throw new common_1.InternalServerErrorException('Failed to retrieve updated conversation');
            }
            return this.formatConversationResponse(updatedConversation);
        }
        catch (error) {
            console.error('Error adding participants:', error);
            if (error instanceof common_1.BadRequestException ||
                error instanceof common_1.NotFoundException ||
                error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to add participants');
        }
    }
    async markMessageAsRead(userId, conversationId, messageId) {
        try {
            if (!mongoose_2.Types.ObjectId.isValid(messageId)) {
                throw new common_1.BadRequestException('Invalid message ID');
            }
            if (!mongoose_2.Types.ObjectId.isValid(conversationId)) {
                throw new common_1.BadRequestException('Invalid conversation ID');
            }
            if (!mongoose_2.Types.ObjectId.isValid(userId)) {
                throw new common_1.BadRequestException('Invalid user ID');
            }
            const message = await this.messageModel.findById(messageId);
            if (!message || message.conversationId.toString() !== conversationId) {
                throw new common_1.NotFoundException('Message not found');
            }
            const conversation = await this.conversationModel.findById(conversationId);
            if (!conversation) {
                throw new common_1.NotFoundException('Conversation not found');
            }
            if (!conversation.participants.some((p) => p.toString() === userId)) {
                throw new common_1.ForbiddenException('You are not a participant in this conversation');
            }
            const alreadyRead = message.readBy.some((r) => r.user.toString() === userId);
            if (!alreadyRead) {
                message.readBy.push({
                    user: new mongoose_2.Types.ObjectId(userId),
                    readAt: new Date(),
                });
                await message.save();
            }
        }
        catch (error) {
            console.error('Error marking message as read:', error);
            if (error instanceof common_1.BadRequestException ||
                error instanceof common_1.NotFoundException ||
                error instanceof common_1.ForbiddenException) {
                throw error;
            }
        }
    }
    async getConversationById(userId, conversationId) {
        try {
            if (!mongoose_2.Types.ObjectId.isValid(conversationId)) {
                throw new common_1.BadRequestException('Invalid conversation ID');
            }
            if (!mongoose_2.Types.ObjectId.isValid(userId)) {
                throw new common_1.BadRequestException('Invalid user ID');
            }
            const conversation = await this.conversationModel
                .findById(conversationId)
                .populate('participants', 'email username isActive lastLogin')
                .populate({
                path: 'lastMessage',
                populate: { path: 'sender', select: 'email username' },
            });
            if (!conversation) {
                throw new common_1.NotFoundException('Conversation not found');
            }
            if (!conversation.participants.some((p) => p._id.toString() === userId)) {
                throw new common_1.ForbiddenException('You are not a participant in this conversation');
            }
            return this.formatConversationResponse(conversation);
        }
        catch (error) {
            console.error('Error getting conversation:', error);
            if (error instanceof common_1.BadRequestException ||
                error instanceof common_1.NotFoundException ||
                error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to get conversation');
        }
    }
    async createSystemMessage(conversationId, content) {
        try {
            const systemMessage = new this.messageModel({
                conversationId: new mongoose_2.Types.ObjectId(conversationId),
                sender: null,
                content,
                type: 'system',
                createdAt: new Date(),
            });
            const savedMessage = await systemMessage.save();
            await this.conversationModel.findByIdAndUpdate(conversationId, {
                lastMessage: savedMessage._id,
                lastActivity: new Date(),
            });
        }
        catch (error) {
            console.error('Error creating system message:', error);
        }
    }
    formatConversationResponse(conversation, currentUserId) {
        try {
            const isAdmin = conversation.type === 'group' &&
                conversation.createdBy?.toString() === currentUserId;
            return {
                id: conversation._id?.toString() ?? '',
                name: conversation.name ?? '',
                type: conversation.type ?? 'direct',
                participants: (conversation.participants ?? [])
                    .map((p) => this.formatUserResponse(p))
                    .filter(Boolean),
                createdBy: conversation.createdBy?.toString() ?? '',
                lastMessage: conversation.lastMessage
                    ? this.formatMessageResponse(conversation.lastMessage)
                    : undefined,
                lastActivity: conversation.lastActivity ?? new Date(),
                description: conversation.description ?? undefined,
                avatar: conversation.avatar ?? undefined,
                isAdmin,
            };
        }
        catch (error) {
            console.error('Error formatting conversation response:', error);
            throw new common_1.InternalServerErrorException('Failed to format conversation data');
        }
    }
    formatMessageResponse(message) {
        try {
            return {
                id: message._id?.toString() ?? '',
                conversationId: message.conversationId?.toString() ?? '',
                sender: message.sender ? this.formatUserResponse(message.sender) : null,
                content: message.content ?? '',
                type: message.type ?? 'text',
                createdAt: message.createdAt ?? new Date(),
                edited: !!message.edited,
                editedAt: message.editedAt ?? undefined,
                readBy: (message.readBy || []).map((r) => ({
                    user: (r.user?._id ?? r.user)?.toString() ?? '',
                    readAt: r.readAt ?? new Date(),
                })),
                replyTo: message.replyTo ? this.formatMessageResponse(message.replyTo) : undefined,
            };
        }
        catch (error) {
            console.error('Error formatting message response:', error);
            throw new common_1.InternalServerErrorException('Failed to format message data');
        }
    }
    formatUserResponse(user) {
        try {
            if (!user)
                return null;
            return {
                id: user._id?.toString() ?? '',
                email: user.email ?? '',
                username: user.username ?? '',
                isActive: !!user.isActive,
                lastLogin: user.lastLogin ?? undefined,
            };
        }
        catch (error) {
            console.error('Error formatting user response:', error);
            throw new common_1.InternalServerErrorException('Failed to format user data');
        }
    }
    async validateUserExists(userId) {
        try {
            if (!mongoose_2.Types.ObjectId.isValid(userId)) {
                return false;
            }
            const user = await this.userModel.findById(userId);
            return !!user;
        }
        catch (error) {
            console.error('Error validating user:', error);
            return false;
        }
    }
    async validateConversationAccess(userId, conversationId) {
        try {
            if (!mongoose_2.Types.ObjectId.isValid(userId) || !mongoose_2.Types.ObjectId.isValid(conversationId)) {
                return false;
            }
            const conversation = await this.conversationModel.findById(conversationId);
            if (!conversation) {
                return false;
            }
            return conversation.participants.some((p) => p.toString() === userId);
        }
        catch (error) {
            console.error('Error validating conversation access:', error);
            return false;
        }
    }
    async removeParticipants(userId, removeParticipantsDto) {
        try {
            const { conversationId, participantIds } = removeParticipantsDto;
            if (!mongoose_2.Types.ObjectId.isValid(conversationId)) {
                throw new common_1.BadRequestException('Invalid conversation ID');
            }
            if (!mongoose_2.Types.ObjectId.isValid(userId)) {
                throw new common_1.BadRequestException('Invalid user ID');
            }
            if (!participantIds || participantIds.length === 0) {
                throw new common_1.BadRequestException('At least one participant ID is required');
            }
            const invalidIds = participantIds.filter(id => !mongoose_2.Types.ObjectId.isValid(id));
            if (invalidIds.length > 0) {
                throw new common_1.BadRequestException('Invalid participant IDs provided');
            }
            const conversation = await this.conversationModel.findById(conversationId);
            if (!conversation) {
                throw new common_1.NotFoundException('Conversation not found');
            }
            if (conversation.type !== 'group') {
                throw new common_1.BadRequestException('Can only remove participants from group conversations');
            }
            if (conversation.createdBy.toString() !== userId) {
                throw new common_1.ForbiddenException('Only group admin can remove participants');
            }
            if (participantIds.includes(userId)) {
                throw new common_1.BadRequestException('Admin cannot remove themselves from the group');
            }
            const participantsToRemove = await this.userModel.find({
                _id: { $in: participantIds.map(id => new mongoose_2.Types.ObjectId(id)) }
            });
            const removedUsernames = participantsToRemove.map(p => p.username);
            conversation.participants = conversation.participants.filter((p) => !participantIds.some(id => p.toString() === id));
            conversation.lastActivity = new Date();
            await conversation.save();
            await this.createSystemMessage(conversationId, `${removedUsernames.join(', ')} ${removedUsernames.length === 1 ? 'was' : 'were'} removed from the group`);
            const updatedConversation = await this.conversationModel
                .findById(conversationId)
                .populate('participants', 'email username isActive lastLogin')
                .populate({
                path: 'lastMessage',
                populate: { path: 'sender', select: 'email username' },
            });
            if (!updatedConversation) {
                throw new common_1.InternalServerErrorException('Failed to retrieve updated conversation');
            }
            return this.formatConversationResponse(updatedConversation);
        }
        catch (error) {
            console.error('Error removing participants:', error);
            if (error instanceof common_1.BadRequestException ||
                error instanceof common_1.NotFoundException ||
                error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to remove participants');
        }
    }
    async deleteMessages(userId, deleteMessagesDto) {
        try {
            const { conversationId, messageIds } = deleteMessagesDto;
            if (!mongoose_2.Types.ObjectId.isValid(conversationId)) {
                throw new common_1.BadRequestException('Invalid conversation ID');
            }
            if (!mongoose_2.Types.ObjectId.isValid(userId)) {
                throw new common_1.BadRequestException('Invalid user ID');
            }
            if (!messageIds || messageIds.length === 0) {
                throw new common_1.BadRequestException('At least one message ID is required');
            }
            const invalidIds = messageIds.filter(id => !mongoose_2.Types.ObjectId.isValid(id));
            if (invalidIds.length > 0) {
                throw new common_1.BadRequestException('Invalid message IDs provided');
            }
            const conversation = await this.conversationModel.findById(conversationId);
            if (!conversation) {
                throw new common_1.NotFoundException('Conversation not found');
            }
            if (!conversation.participants.some((p) => p.toString() === userId)) {
                throw new common_1.ForbiddenException('You are not a participant in this conversation');
            }
            const isAdmin = conversation.type === 'group' && conversation.createdBy.toString() === userId;
            const messages = await this.messageModel.find({
                _id: { $in: messageIds.map(id => new mongoose_2.Types.ObjectId(id)) },
                conversationId: new mongoose_2.Types.ObjectId(conversationId),
            });
            if (messages.length === 0) {
                return {
                    deletedCount: 0,
                    skippedCount: messageIds.length
                };
            }
            let deletableMessages;
            if (isAdmin) {
                deletableMessages = messages;
            }
            else {
                deletableMessages = messages.filter(msg => msg.sender?.toString() === userId);
            }
            const skippedCount = messageIds.length - deletableMessages.length;
            if (deletableMessages.length === 0) {
                return {
                    deletedCount: 0,
                    skippedCount: messageIds.length
                };
            }
            await this.messageModel.deleteMany({
                _id: { $in: deletableMessages.map(msg => msg._id) }
            });
            const lastMessageDeleted = deletableMessages.some(msg => msg._id.toString() === conversation.lastMessage?.toString());
            if (lastMessageDeleted) {
                const newLastMessage = await this.messageModel
                    .findOne({ conversationId: new mongoose_2.Types.ObjectId(conversationId) })
                    .sort({ createdAt: -1 });
                await this.conversationModel.findByIdAndUpdate(conversationId, {
                    lastMessage: newLastMessage?._id || null,
                    lastActivity: new Date(),
                });
            }
            const result = {
                deletedCount: deletableMessages.length,
                skippedCount,
            };
            this.chatGateway.emitMessageDeleted(conversationId, deletableMessages.map(msg => msg._id.toString()), userId, result);
            return result;
        }
        catch (error) {
            console.error('Error deleting messages:', error);
            if (error instanceof common_1.BadRequestException ||
                error instanceof common_1.NotFoundException ||
                error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to delete messages');
        }
    }
    async clearChat(userId, conversationId) {
        try {
            if (!mongoose_2.Types.ObjectId.isValid(conversationId)) {
                throw new common_1.BadRequestException('Invalid conversation ID');
            }
            if (!mongoose_2.Types.ObjectId.isValid(userId)) {
                throw new common_1.BadRequestException('Invalid user ID');
            }
            const conversation = await this.conversationModel.findById(conversationId);
            if (!conversation) {
                throw new common_1.NotFoundException('Conversation not found');
            }
            if (!conversation.participants.some((p) => p.toString() === userId)) {
                throw new common_1.ForbiddenException('You are not a participant in this conversation');
            }
            if (conversation.type === 'group' && conversation.createdBy.toString() !== userId) {
                throw new common_1.ForbiddenException('Only group admin can clear chat history');
            }
            const messageCount = await this.messageModel.countDocuments({
                conversationId: new mongoose_2.Types.ObjectId(conversationId)
            });
            await this.messageModel.deleteMany({
                conversationId: new mongoose_2.Types.ObjectId(conversationId)
            });
            await this.conversationModel.findByIdAndUpdate(conversationId, {
                lastMessage: null,
                lastActivity: new Date(),
            });
            await this.createSystemMessage(conversationId, conversation.type === 'group'
                ? 'Chat history was cleared by admin'
                : 'Chat history was cleared');
            return { clearedCount: messageCount };
        }
        catch (error) {
            console.error('Error clearing chat:', error);
            if (error instanceof common_1.BadRequestException ||
                error instanceof common_1.NotFoundException ||
                error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to clear chat');
        }
    }
    async updateGroup(userId, updateGroupDto) {
        try {
            const { conversationId, name, description } = updateGroupDto;
            if (!mongoose_2.Types.ObjectId.isValid(conversationId)) {
                throw new common_1.BadRequestException('Invalid conversation ID');
            }
            if (!mongoose_2.Types.ObjectId.isValid(userId)) {
                throw new common_1.BadRequestException('Invalid user ID');
            }
            if (!name && description === undefined) {
                throw new common_1.BadRequestException('At least name or description must be provided');
            }
            const conversation = await this.conversationModel.findById(conversationId);
            if (!conversation) {
                throw new common_1.NotFoundException('Conversation not found');
            }
            if (conversation.type !== 'group') {
                throw new common_1.BadRequestException('Can only update group conversations');
            }
            if (conversation.createdBy.toString() !== userId) {
                throw new common_1.ForbiddenException('Only group admin can update group details');
            }
            const updates = { lastActivity: new Date() };
            let systemMessages = [];
            if (name && name.trim() && name.trim() !== conversation.name) {
                const oldName = conversation.name;
                updates.name = name.trim();
                systemMessages.push(`Group name changed from "${oldName}" to "${name.trim()}"`);
            }
            if (description !== undefined && description !== conversation.description) {
                updates.description = description?.trim() || undefined;
                if (description?.trim()) {
                    systemMessages.push(`Group description updated`);
                }
                else {
                    systemMessages.push(`Group description removed`);
                }
            }
            if (Object.keys(updates).length === 1) {
                throw new common_1.BadRequestException('No changes detected');
            }
            await this.conversationModel.findByIdAndUpdate(conversationId, updates);
            for (const message of systemMessages) {
                await this.createSystemMessage(conversationId, message);
            }
            const updatedConversation = await this.conversationModel
                .findById(conversationId)
                .populate('participants', 'email username isActive lastLogin')
                .populate({
                path: 'lastMessage',
                populate: { path: 'sender', select: 'email username' },
            });
            if (!updatedConversation) {
                throw new common_1.InternalServerErrorException('Failed to retrieve updated conversation');
            }
            return this.formatConversationResponse(updatedConversation);
        }
        catch (error) {
            console.error('Error updating group:', error);
            if (error instanceof common_1.BadRequestException ||
                error instanceof common_1.NotFoundException ||
                error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to update group');
        }
    }
    async deleteConversation(userId, conversationId) {
        try {
            if (!mongoose_2.Types.ObjectId.isValid(conversationId)) {
                throw new common_1.BadRequestException('Invalid conversation ID');
            }
            if (!mongoose_2.Types.ObjectId.isValid(userId)) {
                throw new common_1.BadRequestException('Invalid user ID');
            }
            const conversation = await this.conversationModel.findById(conversationId).populate('participants');
            if (!conversation) {
                throw new common_1.NotFoundException('Conversation not found');
            }
            if (!conversation.participants.some((p) => p._id.toString() === userId)) {
                throw new common_1.ForbiddenException('You are not a participant in this conversation');
            }
            if (conversation.type === 'direct') {
                await this.messageModel.deleteMany({
                    conversationId: new mongoose_2.Types.ObjectId(conversationId)
                });
                await this.conversationModel.findByIdAndDelete(conversationId);
                return { message: 'Conversation deleted successfully' };
            }
            else {
                const isAdmin = conversation.createdBy.toString() === userId;
                const remainingParticipants = conversation.participants.filter((p) => p._id.toString() !== userId);
                if (remainingParticipants.length === 0) {
                    await this.messageModel.deleteMany({
                        conversationId: new mongoose_2.Types.ObjectId(conversationId)
                    });
                    await this.conversationModel.findByIdAndDelete(conversationId);
                    return { message: 'Group deleted successfully' };
                }
                if (isAdmin) {
                    const newAdminId = remainingParticipants[0]._id || remainingParticipants[0];
                    const newAdmin = await this.userModel.findById(newAdminId);
                    const leavingUser = await this.userModel.findById(userId);
                    conversation.participants = remainingParticipants.map((p) => p._id || p);
                    conversation.createdBy = newAdminId;
                    conversation.lastActivity = new Date();
                    const updatedConversation = await conversation.save();
                    await this.createSystemMessage(conversationId, `${leavingUser?.username || 'User'} left the group`);
                    await this.createSystemMessage(conversationId, `${newAdmin?.username || 'User'} is now the group admin`);
                    const populatedConversation = await this.conversationModel
                        .findById(conversationId)
                        .populate('participants')
                        .populate('createdBy');
                    return {
                        message: 'Left group successfully',
                        reassigned: true,
                        newAdmin: newAdminId.toString(),
                        updatedConversation: populatedConversation
                    };
                }
                else {
                    const user = await this.userModel.findById(userId);
                    conversation.participants = remainingParticipants.map((p) => p._id || p);
                    conversation.lastActivity = new Date();
                    await conversation.save();
                    await this.createSystemMessage(conversationId, `${user?.username || 'User'} left the group`);
                    return { message: 'Left group successfully' };
                }
            }
        }
        catch (error) {
            console.error('Error deleting conversation:', error);
            if (error instanceof common_1.BadRequestException ||
                error instanceof common_1.NotFoundException ||
                error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to delete conversation');
        }
    }
    async getConversationDetails(userId, conversationId) {
        try {
            if (!mongoose_2.Types.ObjectId.isValid(conversationId)) {
                throw new common_1.BadRequestException('Invalid conversation ID');
            }
            if (!mongoose_2.Types.ObjectId.isValid(userId)) {
                throw new common_1.BadRequestException('Invalid user ID');
            }
            const conversation = await this.conversationModel
                .findById(conversationId)
                .populate('participants', 'email username isActive lastLogin')
                .populate({
                path: 'lastMessage',
                populate: { path: 'sender', select: 'email username' },
            });
            if (!conversation) {
                throw new common_1.NotFoundException('Conversation not found');
            }
            if (!conversation.participants.some((p) => p._id.toString() === userId)) {
                throw new common_1.ForbiddenException('You are not a participant in this conversation');
            }
            const isAdmin = conversation.type === 'group' && conversation.createdBy.toString() === userId;
            const canManage = conversation.type === 'direct' || isAdmin;
            return {
                ...this.formatConversationResponse(conversation),
                isAdmin,
                canManage,
            };
        }
        catch (error) {
            console.error('Error getting conversation details:', error);
            if (error instanceof common_1.BadRequestException ||
                error instanceof common_1.NotFoundException ||
                error instanceof common_1.ForbiddenException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to get conversation details');
        }
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(chat_schema_1.Conversation.name)),
    __param(1, (0, mongoose_1.InjectModel)(chat_schema_2.Message.name)),
    __param(2, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __param(3, (0, common_2.Inject)((0, common_2.forwardRef)(() => chat_gateway_1.ChatGateway))),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        chat_gateway_1.ChatGateway])
], ChatService);
//# sourceMappingURL=chat.service.js.map