import { model, Schema } from "mongoose";
import crypto from "crypto";

const chatSchema = new Schema(
  {
    chatId: {
      type: String,
      required: true,
      default: () => crypto.randomUUid(),
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
    userId: {type: String, required: true},
    vendorId: {type: String, required: true},
  },
  { timestamps: true }
);

export const ChatModel = model("Chat", chatSchema)
