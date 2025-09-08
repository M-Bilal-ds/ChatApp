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
exports.MessageSchema = exports.ConversationSchema = exports.Message = exports.Conversation = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Conversation = class Conversation {
    _id;
    name;
    participants;
    createdBy;
    type;
    lastMessage;
    lastActivity;
    description;
    avatar;
};
exports.Conversation = Conversation;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Conversation.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [{ type: mongoose_2.Types.ObjectId, ref: 'User' }], required: true }),
    __metadata("design:type", Array)
], Conversation.prototype, "participants", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Conversation.prototype, "createdBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['direct', 'group'], default: 'direct' }),
    __metadata("design:type", String)
], Conversation.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Message' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Conversation.prototype, "lastMessage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: Date.now }),
    __metadata("design:type", Date)
], Conversation.prototype, "lastActivity", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Conversation.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Conversation.prototype, "avatar", void 0);
exports.Conversation = Conversation = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
    })
], Conversation);
let Message = class Message {
    _id;
    conversationId;
    sender;
    content;
    type;
    readBy;
    edited;
    editedAt;
    isSystemMessage;
    replyTo;
    metadata;
};
exports.Message = Message;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Conversation', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Message.prototype, "conversationId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: false }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Message.prototype, "sender", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Message.prototype, "content", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['text', 'image', 'file', 'system'], default: 'text' }),
    __metadata("design:type", String)
], Message.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: [{ user: { type: mongoose_2.Types.ObjectId, ref: 'User' }, readAt: Date }],
        default: [],
    }),
    __metadata("design:type", Array)
], Message.prototype, "readBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Message.prototype, "edited", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Message.prototype, "editedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Message.prototype, "isSystemMessage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Message' }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Message.prototype, "replyTo", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object }),
    __metadata("design:type", Object)
], Message.prototype, "metadata", void 0);
exports.Message = Message = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
    })
], Message);
exports.ConversationSchema = mongoose_1.SchemaFactory.createForClass(Conversation);
exports.MessageSchema = mongoose_1.SchemaFactory.createForClass(Message);
exports.ConversationSchema.index({ participants: 1, lastActivity: -1 });
exports.ConversationSchema.index({ type: 1, lastActivity: -1 });
exports.MessageSchema.index({ conversationId: 1, createdAt: -1 });
exports.MessageSchema.index({ sender: 1, createdAt: -1 });
//# sourceMappingURL=chat.schema.js.map