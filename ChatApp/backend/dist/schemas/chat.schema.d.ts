import { Document, Types } from 'mongoose';
export type ConversationDocument = Conversation & Document;
export type MessageDocument = Message & Document;
export declare class Conversation {
    _id: Types.ObjectId;
    name: string;
    participants: Types.ObjectId[];
    createdBy: Types.ObjectId;
    type: string;
    lastMessage: Types.ObjectId;
    lastActivity: Date;
    description: string;
    avatar: string;
}
export declare class Message {
    _id: Types.ObjectId;
    conversationId: Types.ObjectId;
    sender: Types.ObjectId;
    content: string;
    type: string;
    readBy: {
        user: Types.ObjectId;
        readAt: Date;
    }[];
    edited: boolean;
    editedAt: Date;
    isSystemMessage: boolean;
    replyTo: Types.ObjectId;
    metadata: any;
}
export declare const ConversationSchema: import("mongoose").Schema<Conversation, import("mongoose").Model<Conversation, any, any, any, Document<unknown, any, Conversation, any, {}> & Conversation & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Conversation, Document<unknown, {}, import("mongoose").FlatRecord<Conversation>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Conversation> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
export declare const MessageSchema: import("mongoose").Schema<Message, import("mongoose").Model<Message, any, any, any, Document<unknown, any, Message, any, {}> & Message & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Message, Document<unknown, {}, import("mongoose").FlatRecord<Message>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Message> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
