import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;
export type MessageDocument = Message & Document;

@Schema({
  timestamps: true,
})
export class Conversation {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
  participants: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ enum: ['direct', 'group'], default: 'direct' })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  lastMessage: Types.ObjectId;

  @Prop({ default: Date.now })
  lastActivity: Date;

  @Prop()
  description: string;

  @Prop()
  avatar: string;
}

@Schema({
  timestamps: true,
})
export class Message {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  sender: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ enum: ['text', 'image', 'file', 'system'], default: 'text' })
  type: string;

  @Prop({
    type: [{ user: { type: Types.ObjectId, ref: 'User' }, readAt: Date }],
    default: [],
  })
  readBy: { user: Types.ObjectId; readAt: Date }[];

  @Prop({ default: false })
  edited: boolean;

  @Prop()
  editedAt: Date;

  @Prop({ default: false })
  isSystemMessage: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  replyTo: Types.ObjectId;

  @Prop({ type: Object })
  metadata: any;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
export const MessageSchema = SchemaFactory.createForClass(Message);

ConversationSchema.index({ participants: 1, lastActivity: -1 });
ConversationSchema.index({ type: 1, lastActivity: -1 });
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ sender: 1, createdAt: -1 });
