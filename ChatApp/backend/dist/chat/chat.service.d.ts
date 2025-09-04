import { Model } from 'mongoose';
import { ConversationDocument } from '../schemas/chat.schema';
import { MessageDocument } from '../schemas/chat.schema';
import { UserDocument } from '../schemas/user.schema';
import { CreateDirectConversationDto, CreateGroupConversationDto, SendMessageDto, AddParticipantsDto, ConversationResponseDto, MessageResponseDto, UserResponseDto } from './dto/chat.dto';
import { RemoveParticipantsDto, DeleteMessagesDto, UpdateGroupDto } from './dto/chat.dto';
export declare class ChatService {
    private conversationModel;
    private messageModel;
    private userModel;
    constructor(conversationModel: Model<ConversationDocument>, messageModel: Model<MessageDocument>, userModel: Model<UserDocument>);
    createDirectConversation(userId: string, createDirectDto: CreateDirectConversationDto): Promise<ConversationResponseDto>;
    createGroupConversation(userId: string, createGroupDto: CreateGroupConversationDto): Promise<ConversationResponseDto>;
    getUserConversations(userId: string): Promise<ConversationResponseDto[]>;
    sendMessage(userId: string, sendMessageDto: SendMessageDto): Promise<MessageResponseDto>;
    getConversationMessages(userId: string, conversationId: string, page?: number, limit?: number): Promise<MessageResponseDto[]>;
    searchUsers(query: string, currentUserId: string): Promise<UserResponseDto[]>;
    addParticipants(userId: string, addParticipantsDto: AddParticipantsDto): Promise<ConversationResponseDto>;
    markMessageAsRead(userId: string, conversationId: string, messageId: string): Promise<void>;
    getConversationById(userId: string, conversationId: string): Promise<ConversationResponseDto>;
    private createSystemMessage;
    private formatConversationResponse;
    private formatMessageResponse;
    private formatUserResponse;
    validateUserExists(userId: string): Promise<boolean>;
    validateConversationAccess(userId: string, conversationId: string): Promise<boolean>;
    removeParticipants(userId: string, removeParticipantsDto: RemoveParticipantsDto): Promise<ConversationResponseDto>;
    deleteMessages(userId: string, deleteMessagesDto: DeleteMessagesDto): Promise<{
        deletedCount: number;
        skippedCount: number;
    }>;
    clearChat(userId: string, conversationId: string): Promise<{
        clearedCount: number;
    }>;
    updateGroup(userId: string, updateGroupDto: UpdateGroupDto): Promise<ConversationResponseDto>;
    deleteConversation(userId: string, conversationId: string): Promise<{
        message: string;
        reassigned?: boolean;
        newAdmin?: string;
        updatedConversation?: any;
    }>;
    getConversationDetails(userId: string, conversationId: string): Promise<ConversationResponseDto & {
        isAdmin: boolean;
        canManage: boolean;
    }>;
}
