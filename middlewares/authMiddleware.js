import { auth } from "../configs/fbConfigs.js";
import { ChatModel } from "../models/chatsModel.js";
import { Product } from "../models/productsModel.js";

const userAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.Authorization || req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader?.split("Bearer ")[1] || ""
    : null;
  try {
    if (!token) throw new Error("Unauthorised access one");
    const decodedToken = await auth.verifyIdToken(token);
    if ("user" != decodedToken.role || !decodedToken) {
      throw new Error("Unauthorised access two");
    } else {
      req.auth = decodedToken;
      console.log(decodedToken, "token token");
      return next();
    }
  } catch (err) {
    console.log(err, "error");
    next(err);
  }
};

const verifyVendorOwnership = async (req, res, next) => {
  try {
    const { email, phone } = req.auth.isVerified;
    if (!email || !phone) throw new Error("Unverified vendor");
    const product = await Product.findOne({ productId: req.params.id })
      .select("vendorId")
      .lean();
    console.log(req.params.id, product, "pehdfncb");
    if (req.auth.uid !== product.vendorId)
      throw new Error("Unauthorised access");
    next();
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const verifyAdmin = async (req, res, next) => {
  try {
    if (!req?.auth) throw new Error("User not logged in");
    const isAdmin = req.auth.role === "admin";
    if (isAdmin) {
      return next();
    } else {
      throw new Error("Not an Admin");
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const socketAuthMiddleware = async (socket, next) => {
  // console.log(socket.handshake, "socket")
  const token = socket.handshake.auth?.token;
  try {
    if (!token) throw new Error("Unauthorised access");
    const decodedToken = await auth.verifyIdToken(token);
    if ("user" != decodedToken.role || !decodedToken) {
      throw new Error("Unauthorised access");
    } else {
      socket.user = decodedToken;
      // console.log(decodedToken, "token token");
      next();
    }
  } catch (err) {
    console.log(err, "error");
    next(err);
  }
};

const verifyChatAccess = async (socket, next) => {
  try {
    // console.log(socket.handshake.query.chatId, "idddddd")
    const chatId = socket.handshake.query.chatId;
    const chat = await ChatModel.findOne({ chatId: chatId })
      .lean();
    if (!chat?.vendorBasicInfo.id || !chat?.userBasicInfo.id)
      throw new Error("Chat doesn't exist");
    const isAuthorised = [chat?.vendorBasicInfo.id, chat?.userBasicInfo.id].includes(socket.user.uid)
    if (!isAuthorised) throw new Error("User not authorised");
    next();
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export {
  userAuthMiddleware,
  verifyVendorOwnership,
  verifyAdmin,
  verifyChatAccess,
  socketAuthMiddleware,
};
