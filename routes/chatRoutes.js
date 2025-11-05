import { io } from "../configs/serverConfig.js";
import { allUserChats, getChat, startChat } from "../controllers/chatControllers.js";
import {
  socketAuthMiddleware,
  verifyChatAccess,
  userAuthMiddleware,
} from "../middlewares/authMiddleware.js";
import { ChatModel } from "../models/chatsModel.js";
import express from "express"

io.of("/chat")
  .use(socketAuthMiddleware)
  .use(verifyChatAccess)
  .on("connection", async (socket) => {
    // console.log("connected to chat")
    try {
      socket.on("newMessage", async (data) => {
        console.log("neww", data)
        try {
          const newChat = await ChatModel.findOneAndUpdate(
            { chatId: socket.handshake.query.chatId },
            {$push: { messages: data }},
            {new: true}
          );
          console.log(newChat, "ndhdhfhfhfhfh")
          io.of("/chat").emit("newMessage", newChat.messages);
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