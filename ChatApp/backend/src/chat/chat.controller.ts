import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateDirectConversationDto,
  CreateGroupConversationDto,
  SendMessageDto,
  AddParticipantsDto,
  SearchUsersDto,
  MarkAsReadDto,
} from './dto/chat.dto';
import { fileURLToPath } from 'url';
import { error } from 'console';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Get user's conversations
  @Get('conversations')
  async getUserConversations(@Request() req) {
    return this.chatService.getUserConversations(req.user.sub);
  }

  // Create direct conversation
  @Post('conversations/direct')
  @HttpCode(HttpStatus.CREATED)
  async createDirectConversation(
    @Request() req,
    @Body() createDirectDto: CreateDirectConversationDto,
  ) {
    return this.chatService.createDirectConversation(req.user.sub, createDirectDto);
  }

  // Create group conversation
  @Post('conversations/group')
  @HttpCode(HttpStatus.CREATED)
  async createGroupConversation(
    @Request() req,
    @Body() createGroupDto: CreateGroupConversationDto,
  ) {
    return this.chatService.createGroupConversation(req.user.sub, createGroupDto);
  }

  // Get conversation messages
  @Get('conversations/:id/messages')
  async getConversationMessages(
    @Request() req,
    @Param('id') conversationId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    
    return this.chatService.getConversationMessages(
      req.user.sub,
      conversationId,
      pageNum,
      limitNum,
    );
  }

  // Send message
  @Post('messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(@Request() req, @Body() sendMessageDto: SendMessageDto) {
    return this.chatService.sendMessage(req.user.sub, sendMessageDto);
  }

  // Search users
  @Get('users/search')
  async searchUsers(@Request() req, @Query() searchDto: SearchUsersDto) {
    return this.chatService.searchUsers(searchDto.query, req.user.sub);
  }

  // Add participants to group
  @Post('conversations/participants')
  @HttpCode(HttpStatus.OK)
  async addParticipants(@Request() req, @Body() addParticipantsDto: AddParticipantsDto) {
    return this.chatService.addParticipants(req.user.sub, addParticipantsDto);
  }

  // Mark message as read
  @Post('messages/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Request() req, @Body() markAsReadDto: MarkAsReadDto) {
    return this.chatService.markMessageAsRead(
      req.user.sub,
      markAsReadDto.conversationId,
      markAsReadDto.messageId,
    );
  }
}
