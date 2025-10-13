import express from "express";
import {
  createUser,
  deleteUserProfilePhoto,
  getUser,
  setLoggedInUserCookie,
  updateUser,
  uploadUserProfilePhoto,
} from "../controllers/userAuthControllers.js";
import { userAuthMiddleware } from "../middlewares/userAuthMiddleware.js";
import { upload } from "../utils/usersUtilFns.js";
import { addToCart, deleteFromCart, getOrderHistory } from "../controllers/userDataControllers.js";
import { cancelOrder, placeOrders } from "../controllers/ordersControllers.js";

const router = express.Router();

router.post("/register", createUser);
router.get("/get", userAuthMiddleware, getUser)
router.post("/update", userAuthMiddleware, updateUser); 
router.post("/uploads", userAuthMiddleware, upload.single("profilePhoto"), uploadUserProfilePhoto);
router.get("/uploads/delete", userAuthMiddleware, deleteUserProfilePhoto);
router.post("/cart/add", userAuthMiddleware, addToCart)
router.delete("/cart/remove", userAuthMiddleware, deleteFromCart)
router.get("/verify", userAuthMiddleware, (req, res)=>res.status(200).json(req.auth))
router.post("/set-cookie", userAuthMiddleware, setLoggedInUserCookie)
router.get("/orders", userAuthMiddleware, getOrderHistory)
router.post("/orders/add", userAuthMiddleware, placeOrders)
router.post("/orders/cancel", userAuthMiddleware, cancelOrder)

export default router;