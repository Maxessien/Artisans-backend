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
  deleteUserProfilePhoto,
  uploadUserProfilePhoto,
} from "../controllers/userDataControllers.js";
import { requestBodyFieldsFilter } from "../middlewares/regMiddleware.js";

const router = express.Router();

router.get("/:id", userAuthMiddleware, getUser);
router.get("/vendor/:id", getVendorInfo)
router.post("/:id",
  requestBodyFieldsFilter([
    "displayName",
    "email",
    "phoneNumber",
    "password",
    "following",
    "wishlist",
    "reviewsMade",
  ]), userAuthMiddleware, updateUser);
router.post(
  "/:id/uploads",
  upload.single("profilePhoto"),
  userAuthMiddleware,
  uploadUserProfilePhoto
);
router.delete("/:id/uploads", userAuthMiddleware, deleteUserProfilePhoto);
router.post("/:id/cart", userAuthMiddleware, addToCart);
router.delete("/:id/cart/:productId", userAuthMiddleware, deleteFromCart);

export default router;
