import { ChatModel } from "../models/ChatsModel";
import { User } from "../models/usersModel";

const getExistingChatMessages = async (soc) => {
  try {
    const existingMessages = ChatModel.findOne({
      chatId: soc.handshake.query.chatId,
    })
      .select("messages")
      .lean();
    return existingMessages.messages;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const startChat = async (req, res) => {
  try {
    const newChat = await ChatModel.addOne({
      messages: [
        {
          senderId: req.auth.uid,
          senderName: req.auth.displayName,
          message: req.body.message,
        },
      ],
      userId: req.auth.uid,
      vendorId: req.body.vendorId,
    });
    await User.updateOne(
      { userId: { $in: [req.auth.uid, req.body.vendorId] } },
      { $addToSet: { chats: newChat.chatId } }
    );
    return res.status(201).json(newChat);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

const getChat = async (req, res) => {
  try {
    const chats = await ChatModel.findOne({
      userId: req.auth.uid,
      vendorId: req.params.vendorId,
    })
      .select("messages")
      .lean();
    return res.status(200).json(chats);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

const allUserChats = async (req, res) => {
  try {
    const chats = await ChatModel.find({
      $or: [
        {userId: req.auth.uid},
        {vendorId: req.auth.uid}
      ]
    })
      .lean();
    return res.status(200).json(chats);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

export { getExistingChatMessages, startChat, getChat, allUserChats };
