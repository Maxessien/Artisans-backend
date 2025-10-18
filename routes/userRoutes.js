import express from "express";
import {
  createUser,
  getUser,
  sendOtp,
  setLoggedInUserCookie,
  updateUser,
  verifyOtp,
  verifyUserCookie,
} from "../controllers/userAuthControllers.js";
import { userAuthMiddleware } from "../middlewares/authMiddleware.js";
import { upload } from "../utils/usersUtilFns.js";
import {
  addToCart,
  deleteFromCart,
  getOrderHistory,
  deleteUserProfilePhoto,
  uploadUserProfilePhoto,
} from "../controllers/userDataControllers.js";
import { cancelOrder, placeOrders } from "../controllers/ordersControllers.js";

const router = express.Router();

router.post("/register", createUser);
router.get("/get", userAuthMiddleware, getUser);
router.post("/update", userAuthMiddleware, updateUser);
router.post(
  "/uploads",
  userAuthMiddleware,
  upload.single("profilePhoto"),
  uploadUserProfilePhoto
);
router.delete("/uploads/delete", userAuthMiddleware, deleteUserProfilePhoto);
router.post("/cart/add", userAuthMiddleware, addToCart);
router.delete("/cart/remove", userAuthMiddleware, deleteFromCart);
router.get("/verify", userAuthMiddleware, verifyUserCookie);
router.post("/set-cookie", userAuthMiddleware, setLoggedInUserCookie);
router.get("/orders", userAuthMiddleware, getOrderHistory);
router.post("/orders/add", userAuthMiddleware, placeOrders);
router.post("/orders/cancel", userAuthMiddleware, cancelOrder);
router.post("/otp", userAuthMiddleware, sendOtp)
router.post("/otp/verify", userAuthMiddleware, verifyOtp)

export default router;
