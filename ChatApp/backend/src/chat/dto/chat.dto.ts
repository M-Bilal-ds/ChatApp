import { IsEmail, IsNotEmpty, IsString, IsArray, IsOptional, IsEnum, IsMongoId } from 'class-validator';

export class CreateDirectConversationDto {
  @IsEmail()
  @IsNotEmpty()
  participantEmail: string;
}

export class CreateGroupConversationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsEmail({}, { each: true })
  participantEmails: string[];

  @IsOptional()
  @IsString()
  description?: string;
}

export class SendMessageDto {
  @IsMongoId()
  @IsNotEmpty()
  conversationId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsEnum(['text', 'image', 'file'])
  type?: string;

  @IsOptional()
  @IsMongoId()
  replyTo?: string;
}

export class AddParticipantsDto {
  @IsMongoId()
  @IsNotEmpty()
  conversationId: string;

  @IsArray()
  @IsEmail({}, { each: true })
  participantEmails: string[];
}

export class SearchUsersDto {
  @IsString()
  @IsNotEmpty()
  query: string;
}

export class MarkAsReadDto {
  @IsMongoId()
  @IsNotEmpty()
  conversationId: string;

  @IsMongoId()
  @IsNotEmpty()
  messageId: string;
}

// Response DTOs
export class UserResponseDto {
  id: string;
  email: string;
  username: string;
  isActive: boolean;
  lastLogin: Date;
}

export class ConversationResponseDto {
  id: string;
  name: string;
  type: string;
  participants: UserResponseDto[];
  createdBy: string;
  lastMessage?: MessageResponseDto;
  lastActivity: Date;
  description?: string;
  avatar?: string;
  isAdmin?: boolean;
  unreadCount?: number;
}

export class MessageResponseDto {
  id: string;
  conversationId: string;
  // Allow null for system messages
  sender: UserResponseDto | null;
  content: string;
  type: string;
  createdAt: Date;
  edited: boolean;
  isAdmin?: boolean;
  editedAt?: Date;
  readBy: { user: string; readAt: Date }[];
  replyTo?: MessageResponseDto;
}

// Add these new DTOs to your existing chat.dto.ts file

export class RemoveParticipantsDto {
  @IsMongoId()
  @IsNotEmpty()
  conversationId: string;

  @IsArray()
  @IsMongoId({ each: true })
  participantIds: string[];
}

export class DeleteMessagesDto {
  @IsMongoId()
  @IsNotEmpty()
  conversationId: string;

  @IsArray()
  @IsMongoId({ each: true })
  messageIds: string[];
}

export class ClearChatDto {
  @IsMongoId()
  @IsNotEmpty()
  conversationId: string;
}

export class UpdateGroupDto {
  @IsMongoId()
  @IsNotEmpty()
  conversationId: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class DeleteConversationDto {
  @IsMongoId()
  @IsNotEmpty()
  conversationId: string;
}