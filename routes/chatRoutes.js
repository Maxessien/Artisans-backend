import { allUserChats, getChat, getExistingChatMessages, startChat } from "../controllers/chatControllers";
import { io } from "../index";
import {
  socketAuthMiddleware,
  verifyChatAccess,
  userAuthMiddleware,
} from "../middlewares/authMiddleware";
import { ChatModel } from "../models/ChatsModel";
import express from "express"

io.of("/chat")
  .use(socketAuthMiddleware)
  .use(verifyChatAccess)
  .on("connection", async (socket) => {
    try {
      const existingMessages = await getExistingChatMessages(soc);
      socket.emit("previousMessages", existingMessages);
      socket.on("newMessage", async (data) => {
        try {
          await ChatModel.updateOne(
            { chatId: socket.handshake.query.chatId },
            {$push: { messages: [...previousMessages, data] }}
          );
          io.of("/chat/existing").emit("newMessage", data);
        } catch (err) {
          console.log(err);
          socket.emit("serverError", err);
        }
      });
    } catch (err) {
      console.log(err);
      socket.emit("serverError", err);
    }
  });

const router = express.Router()

router.post("/", userAuthMiddleware, startChat)
router.get("/", userAuthMiddleware, allUserChats)
router.get("/:id", userAuthMiddleware, getChat)

export default router