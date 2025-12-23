import express from "express";
import {
  getUser,
  getVendorInfo,
  updateUser,
} from "../controllers/userAuthControllers.js";
import { userAuthMiddleware } from "../middlewares/authMiddleware.js";
import { upload } from "../utils/usersUtilFns.js";
import {
  addToCart,
  deleteFromCart,
  uploadUserProfilePhoto,
} from "../controllers/userDataControllers.js";
import { requestFieldsFilter } from "../middlewares/regMiddleware.js";

const router = express.Router();

router.get("/:id", userAuthMiddleware, getUser);
router.post("/:id",
  requestFieldsFilter([
    "displayName",
  ]), userAuthMiddleware, updateUser);
router.post(
  "/:id/uploads",
  upload.single("profilePhoto"),
  userAuthMiddleware,
  uploadUserProfilePhoto
);
router.post("/:id/cart", userAuthMiddleware, addToCart);
router.delete("/:id/cart/:productId", userAuthMiddleware, deleteFromCart);

export default router;
