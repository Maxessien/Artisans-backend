import { model, Schema } from "mongoose";
import crypto from "crypto";

const chatSchema = new Schema(
  {
    chatId: {
      type: String,
      required: true,
      default: () => crypto.randomUUID(),
      immutable: true,
    },
    messages: {
      type: [
        {
          senderId: String,
          senderName: String,
          message: String,
          timeSent: {type: Date, default: () => Date.now()},
        },
      ],
    },
    userBasicInfo: {type: {id: String, name: String, profileImageUrl: String}, required: true},
    vendorBasicInfo: {type: {id: String, name: String, profileImageUrl: String}, required: true},
  },
  { timestamps: true }
);

export const ChatModel = model("Chat", chatSchema)
