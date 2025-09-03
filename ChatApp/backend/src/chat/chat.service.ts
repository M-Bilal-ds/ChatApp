import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Conversation, ConversationDocument } from '../schemas/chat.schema';
import { Message, MessageDocument } from '../schemas/chat.schema';
import { User, UserDocument } from '../schemas/user.schema';
import {
  CreateDirectConversationDto,
  CreateGroupConversationDto,
  SendMessageDto,
  AddParticipantsDto,
  ConversationResponseDto,
  MessageResponseDto,
  UserResponseDto,
} from './dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  // Create direct conversation
  async createDirectConversation(
    userId: string,
    createDirectDto: CreateDirectConversationDto,
  ): Promise<ConversationResponseDto> {
    try {
      const { participantEmail } = createDirectDto;

      if (!participantEmail || !participantEmail.trim()) {
        throw new BadRequestException('Participant email is required');
      }

      // Validate userId
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      const participant = await this.userModel.findOne({ 
        email: participantEmail.trim().toLowerCase() 
      });
      
      if (!participant) {
        throw new NotFoundException('User not found with that email');
      }

      if (participant._id.toString() === userId) {
        throw new BadRequestException('Cannot create conversation with yourself');
      }

      // Check for existing direct conversation
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

      // Create new direct conversation
      const conversation = new this.conversationModel({
        name: `${participant.username}`,
        participants: [new Types.ObjectId(userId), participant._id],
        createdBy: new Types.ObjectId(userId),
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
        throw new InternalServerErrorException('Failed to retrieve created conversation');
      }

      return this.formatConversationResponse(populatedConversation);
    } catch (error) {
      console.error('Error creating direct conversation:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException || 
          error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create direct conversation');
    }
  }

  // Create group conversation
async createGroupConversation(
  userId: string,
  createGroupDto: CreateGroupConversationDto,
): Promise<ConversationResponseDto> {
  try {
    const { name, participantEmails, description } = createGroupDto;

    if (!name || !name.trim()) {
      throw new BadRequestException('Group name is required');
    }

    if (!participantEmails || participantEmails.length === 0) {
      throw new BadRequestException('At least one participant email is required');
    }

    // Validate userId
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid user ID');
    }

    // Clean and validate emails
    const cleanEmails = participantEmails
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0);

    if (cleanEmails.length === 0) {
      throw new BadRequestException('Valid participant emails are required');
    }

    const participants = await this.userModel.find({
      email: { $in: cleanEmails },
    });

    if (participants.length !== cleanEmails.length) {
      const foundEmails = participants.map(p => p.email);
      const notFound = cleanEmails.filter(email => !foundEmails.includes(email));
      throw new NotFoundException(`Users not found: ${notFound.join(', ')}`);
    }

    const participantIds = participants.map((p) => p._id as Types.ObjectId);

    // Add creator if not already in participants
    if (!participantIds.some((id) => id.toString() === userId)) {
      participantIds.push(new Types.ObjectId(userId));
    }

    const conversation = new this.conversationModel({
      name: name.trim(),
      participants: participantIds, // Remove the duplicate addition here
      createdBy: new Types.ObjectId(userId),
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
      throw new InternalServerErrorException('Failed to retrieve created conversation');
    }

    // Create welcome system message
    await this.createSystemMessage(
      savedConversation._id.toString(),
      `Group "${name.trim()}" was created`
    );

    return this.formatConversationResponse(populatedConversation);
  } catch (error) {
    console.error('Error creating group conversation:', error);
    if (error instanceof BadRequestException || 
        error instanceof NotFoundException || 
        error instanceof ForbiddenException) {
      throw error;
    }
    throw new InternalServerErrorException('Failed to create group conversation');
  }
}

  // Get user's conversations
  async getUserConversations(userId: string): Promise<ConversationResponseDto[]> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      const conversations = await this.conversationModel
        .find({ participants: new Types.ObjectId(userId) }) 
        .populate('participants', 'email username isActive lastLogin')
        .populate({
          path: 'lastMessage',
          populate: { path: 'sender', select: 'email username' },
        })
        .sort({ lastActivity: -1 });

      return conversations.map((conv) => this.formatConversationResponse(conv));
    } catch (error) {
      console.error('Error getting user conversations:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to load conversations');
    }
  }

  // Send message
  async sendMessage(
    userId: string,
    sendMessageDto: SendMessageDto,
  ): Promise<MessageResponseDto> {
    try {
      const { conversationId, content, type = 'text', replyTo } = sendMessageDto;

      if (!content || !content.trim()) {
        throw new BadRequestException('Message content is required');
      }

      if (!Types.ObjectId.isValid(conversationId)) {
        throw new BadRequestException('Invalid conversation ID');
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      const conversation = await this.conversationModel.findById(conversationId);
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (!conversation.participants.some((p) => p.toString() === userId)) {
        throw new ForbiddenException('You are not a participant in this conversation');
      }

      // Validate replyTo if provided
      if (replyTo && !Types.ObjectId.isValid(replyTo)) {
        throw new BadRequestException('Invalid reply message ID');
      }

      const message = new this.messageModel({
        conversationId: new Types.ObjectId(conversationId),
        sender: new Types.ObjectId(userId),
        content: content.trim(),
        type,
        replyTo: replyTo ? new Types.ObjectId(replyTo) : undefined,
        createdAt: new Date(),
      });

      const savedMessage = await message.save();

      // Update conversation's last message and activity
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
        throw new InternalServerErrorException('Failed to retrieve sent message');
      }

      return this.formatMessageResponse(populatedMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException || 
          error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to send message');
    }
  }

  // Get conversation messages
  async getConversationMessages(
    userId: string,
    conversationId: string,
    page = 1,
    limit = 50,
  ): Promise<MessageResponseDto[]> {
    try {
      if (!Types.ObjectId.isValid(conversationId)) {
        throw new BadRequestException('Invalid conversation ID');
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      const conversation = await this.conversationModel.findById(conversationId);
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (!conversation.participants.some((p) => p.toString() === userId)) {
        throw new ForbiddenException('You are not a participant in this conversation');
      }

      const skip = Math.max(0, (page - 1) * limit);
      const validLimit = Math.min(Math.max(1, limit), 100); // Limit between 1-100

      const messages = await this.messageModel
        .find({ conversationId: new Types.ObjectId(conversationId) })
        .populate('sender', 'email username')
        .populate({
          path: 'replyTo',
          populate: { path: 'sender', select: 'email username' },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(validLimit);

      return messages.reverse().map((msg) => this.formatMessageResponse(msg));
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException || 
          error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to load messages');
    }
  }

  // Search users
  async searchUsers(query: string, currentUserId: string): Promise<UserResponseDto[]> {
    try {
      if (!query || !query.trim()) {
        return [];
      }

      if (!Types.ObjectId.isValid(currentUserId)) {
        throw new BadRequestException('Invalid user ID');
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
    } catch (error) {
      console.error('Error searching users:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to search users');
    }
  }

  // Add participants to group conversation
  async addParticipants(
    userId: string,
    addParticipantsDto: AddParticipantsDto,
  ): Promise<ConversationResponseDto> {
    try {
      const { conversationId, participantEmails } = addParticipantsDto;

      if (!Types.ObjectId.isValid(conversationId)) {
        throw new BadRequestException('Invalid conversation ID');
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      if (!participantEmails || participantEmails.length === 0) {
        throw new BadRequestException('At least one participant email is required');
      }

      const conversation = await this.conversationModel.findById(conversationId);
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (conversation.type !== 'group') {
        throw new BadRequestException('Can only add participants to group conversations');
      }

      if (!conversation.participants.some((p) => p.toString() === userId)) {
        throw new ForbiddenException('You are not a participant in this conversation');
      }

      // Clean and validate emails
      const cleanEmails = participantEmails
        .map(email => email.trim().toLowerCase())
        .filter(email => email.length > 0);

      if (cleanEmails.length === 0) {
        throw new BadRequestException('Valid participant emails are required');
      }

      const newParticipants = await this.userModel.find({
        email: { $in: cleanEmails },
      });

      if (newParticipants.length !== cleanEmails.length) {
        const foundEmails = newParticipants.map(p => p.email);
        const notFound = cleanEmails.filter(email => !foundEmails.includes(email));
        throw new NotFoundException(`Users not found: ${notFound.join(', ')}`);
      }

      const newParticipantIds = newParticipants
        .map((p) => p._id as Types.ObjectId)
        .filter(
          (id) =>
            !conversation.participants.some(
              (existingId) => existingId.toString() === id.toString(),
            ),
        );

      if (newParticipantIds.length === 0) {
        throw new BadRequestException('All users are already participants');
      }

      // Add new participants
      conversation.participants.push(...newParticipantIds);
      conversation.lastActivity = new Date();
      await conversation.save();

      // Create system message about added participants
      const addedUsernames = newParticipants
        .filter((p) => newParticipantIds.some((id) => id.toString() === p._id.toString()))
        .map((p) => p.username);

      await this.createSystemMessage(
        conversationId,
        `${addedUsernames.join(', ')} ${
          addedUsernames.length === 1 ? 'was' : 'were'
        } added to the group`,
      );

      const updatedConversation = await this.conversationModel
        .findById(conversationId)
        .populate('participants', 'email username isActive lastLogin')
        .populate({
          path: 'lastMessage',
          populate: { path: 'sender', select: 'email username' },
        });

      if (!updatedConversation) {
        throw new InternalServerErrorException('Failed to retrieve updated conversation');
      }

      return this.formatConversationResponse(updatedConversation);
    } catch (error) {
      console.error('Error adding participants:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException || 
          error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to add participants');
    }
  }

  // Mark message as read
  async markMessageAsRead(
    userId: string,
    conversationId: string,
    messageId: string,
  ): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(messageId)) {
        throw new BadRequestException('Invalid message ID');
      }

      if (!Types.ObjectId.isValid(conversationId)) {
        throw new BadRequestException('Invalid conversation ID');
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      const message = await this.messageModel.findById(messageId);
      if (!message || message.conversationId.toString() !== conversationId) {
        throw new NotFoundException('Message not found');
      }

      const conversation = await this.conversationModel.findById(conversationId);
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (!conversation.participants.some((p) => p.toString() === userId)) {
        throw new ForbiddenException('You are not a participant in this conversation');
      }

      const alreadyRead = message.readBy.some((r) => r.user.toString() === userId);
      if (!alreadyRead) {
        message.readBy.push({
          user: new Types.ObjectId(userId),
          readAt: new Date(),
        } as any);
        await message.save();
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException || 
          error instanceof ForbiddenException) {
        throw error;
      }
      // Don't throw for read receipts - just log the error
    }
  }

  // Get conversation by ID (for validation)
  async getConversationById(
    userId: string,
    conversationId: string,
  ): Promise<ConversationResponseDto> {
    try {
      if (!Types.ObjectId.isValid(conversationId)) {
        throw new BadRequestException('Invalid conversation ID');
      }

      if (!Types.ObjectId.isValid(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      const conversation = await this.conversationModel
        .findById(conversationId)
        .populate('participants', 'email username isActive lastLogin')
        .populate({
          path: 'lastMessage',
          populate: { path: 'sender', select: 'email username' },
        });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      if (!conversation.participants.some((p: any) => p._id.toString() === userId)) {
        throw new ForbiddenException('You are not a participant in this conversation');
      }

      return this.formatConversationResponse(conversation);
    } catch (error) {
      console.error('Error getting conversation:', error);
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException || 
          error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to get conversation');
    }
  }

  // Create system message (private method)
  private async createSystemMessage(conversationId: string, content: string): Promise<void> {
    try {
      const systemMessage = new this.messageModel({
        conversationId: new Types.ObjectId(conversationId),
        sender: null, // system message (no sender)
        content,
        type: 'system',
        createdAt: new Date(),
      });

      const savedMessage = await systemMessage.save();

      await this.conversationModel.findByIdAndUpdate(conversationId, {
        lastMessage: savedMessage._id,
        lastActivity: new Date(),
      });
    } catch (error) {
      console.error('Error creating system message:', error);
      // Don't throw - system messages are not critical
    }
  }

  // Formatters with better error handling
  private formatConversationResponse(conversation: any): ConversationResponseDto {
    try {
      return {
        id: conversation._id?.toString() ?? '',
        name: conversation.name ?? '',
        type: conversation.type ?? 'direct',
        participants: (conversation.participants ?? [])
          .map((p: any) => this.formatUserResponse(p))
          .filter(Boolean),
        createdBy: conversation.createdBy?.toString() ?? '',
        lastMessage: conversation.lastMessage
          ? this.formatMessageResponse(conversation.lastMessage)
          : undefined,
        lastActivity: conversation.lastActivity ?? new Date(),
        description: conversation.description ?? undefined,
        avatar: conversation.avatar ?? undefined,
      };
    } catch (error) {
      console.error('Error formatting conversation response:', error);
      throw new InternalServerErrorException('Failed to format conversation data');
    }
  }

  private formatMessageResponse(message: any): MessageResponseDto {
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
        readBy: (message.readBy || []).map((r: any) => ({
          user: (r.user?._id ?? r.user)?.toString() ?? '',
          readAt: r.readAt ?? new Date(),
        })),
        replyTo: message.replyTo ? this.formatMessageResponse(message.replyTo) : undefined,
      };
    } catch (error) {
      console.error('Error formatting message response:', error);
      throw new InternalServerErrorException('Failed to format message data');
    }
  }

  private formatUserResponse(user: any): UserResponseDto {
    try {
      if (!user) return null as any;
      
      return {
        id: user._id?.toString() ?? '',
        email: user.email ?? '',
        username: user.username ?? '',
        isActive: !!user.isActive,
        lastLogin: user.lastLogin ?? undefined,
      };
    } catch (error) {
      console.error('Error formatting user response:', error);
      throw new InternalServerErrorException('Failed to format user data');
    }
  }

  // Additional utility methods for better error handling
  async validateUserExists(userId: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(userId)) {
        return false;
      }
      
      const user = await this.userModel.findById(userId);
      return !!user;
    } catch (error) {
      console.error('Error validating user:', error);
      return false;
    }
  }

  async validateConversationAccess(userId: string, conversationId: string): Promise<boolean> {
    try {
      if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(conversationId)) {
        return false;
      }

      const conversation = await this.conversationModel.findById(conversationId);
      if (!conversation) {
        return false;
      }

      return conversation.participants.some((p) => p.toString() === userId);
    } catch (error) {
      console.error('Error validating conversation access:', error);
      return false;
    }
  }
}