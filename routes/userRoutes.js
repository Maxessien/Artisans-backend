import express from "express";
import {
  getUser,
  updateUser,
} from "../controllers/userAuthControllers.js";
import { userAuthMiddleware } from "../middlewares/authMiddleware.js";
import { upload } from "../utils/usersUtilFns.js";
import {
  addToCart,
  deleteFromCart,
  deleteUserProfilePhoto,
  uploadUserProfilePhoto,
} from "../controllers/userDataControllers.js";

const router = express.Router();
router.use(userAuthMiddleware)

router.get("/:id", getUser);
router.post("/:id", updateUser);
router.post(
  "/:id/uploads",
  upload.single("profilePhoto"),
  uploadUserProfilePhoto
);
router.delete("/:id/uploads", deleteUserProfilePhoto);
router.post("/:id/cart", addToCart);
router.delete("/:id/cart/:productId", deleteFromCart);

export default router;
