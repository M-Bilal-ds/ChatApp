export declare class CreateDirectConversationDto {
    participantEmail: string;
}
export declare class CreateGroupConversationDto {
    name: string;
    participantEmails: string[];
    description?: string;
}
export declare class SendMessageDto {
    conversationId: string;
    content: string;
    type?: string;
    replyTo?: string;
}
export declare class AddParticipantsDto {
    conversationId: string;
    participantEmails: string[];
}
export declare class SearchUsersDto {
    query: string;
}
export declare class MarkAsReadDto {
    conversationId: string;
    messageId: string;
}
export declare class UserResponseDto {
    id: string;
    email: string;
    username: string;
    isActive: boolean;
    lastLogin: Date;
}
export declare class ConversationResponseDto {
    id: string;
    name: string;
    type: string;
    participants: UserResponseDto[];
    createdBy: string;
    lastMessage?: MessageResponseDto;
    lastActivity: Date;
    description?: string;
    avatar?: string;
    unreadCount?: number;
}
export declare class MessageResponseDto {
    id: string;
    conversationId: string;
    sender: UserResponseDto | null;
    content: string;
    type: string;
    createdAt: Date;
    edited: boolean;
    editedAt?: Date;
    readBy: {
        user: string;
        readAt: Date;
    }[];
    replyTo?: MessageResponseDto;
}
