import { ChatService } from './chat.service';
import { CreateDirectConversationDto, CreateGroupConversationDto, SendMessageDto, AddParticipantsDto, SearchUsersDto, MarkAsReadDto } from './dto/chat.dto';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    getUserConversations(req: any): Promise<import("./dto/chat.dto").ConversationResponseDto[]>;
    createDirectConversation(req: any, createDirectDto: CreateDirectConversationDto): Promise<import("./dto/chat.dto").ConversationResponseDto>;
    createGroupConversation(req: any, createGroupDto: CreateGroupConversationDto): Promise<import("./dto/chat.dto").ConversationResponseDto>;
    getConversationMessages(req: any, conversationId: string, page?: string, limit?: string): Promise<import("./dto/chat.dto").MessageResponseDto[]>;
    sendMessage(req: any, sendMessageDto: SendMessageDto): Promise<import("./dto/chat.dto").MessageResponseDto>;
    searchUsers(req: any, searchDto: SearchUsersDto): Promise<import("./dto/chat.dto").UserResponseDto[]>;
    addParticipants(req: any, addParticipantsDto: AddParticipantsDto): Promise<import("./dto/chat.dto").ConversationResponseDto>;
    markAsRead(req: any, markAsReadDto: MarkAsReadDto): Promise<void>;
}
