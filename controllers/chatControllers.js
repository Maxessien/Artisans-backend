import { ChatModel } from "../models/chatsModel.js";
import { User } from "../models/usersModel.js";

const getExistingChatMessages = async (soc) => {
  try {
    const existingMessages = await ChatModel.findOne({
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
    const vendor = await User.findOne({userId: req.body.vendorId})
    const newChat = await ChatModel.create({
      messages: [
        {
          senderId: req.auth.uid,
          senderName: req.auth.name,
          message: req.body.message,
        },
      ],
      userBasicInfo: {id: req.auth.uid, name: req.auth.name},
      vendorBasicInfo: {id: vendor.userId, name: vendor.displayName},
    });
    await User.updateOne(
      { userId: { $in: [req.auth.uid, req.body.vendorId] } },
      { $addToSet: { chats: newChat.chatId } }
    );
    console.log(newChat, "newww")
    return res.status(201).json(newChat);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

const getChat = async (req, res) => {
  try {
    const chat = await ChatModel.findOne({
      chatId: req.params.id
    })
      .lean();
    return res.status(200).json(chat);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

const allUserChats = async (req, res) => {
  try {
    const chats = await ChatModel.find({
      $or: [
        {"userBasicInfo.id": req.auth.uid}, 
        {"vendorBasicInfo.id": req.auth.uid}
      ]
    })  
      .lean();
      console.log(chats)
    return res.status(200).json(chats);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

export { getExistingChatMessages, startChat, getChat, allUserChats };
