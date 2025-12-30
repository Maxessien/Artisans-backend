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
  getCartDetails,
  uploadUserProfilePhoto,
} from "../controllers/userDataControllers.js";
import { requestFieldsFilter } from "../middlewares/regMiddleware.js";

const router = express.Router();

router.get("/:id", userAuthMiddleware, getUser);
router.get("/cart", userAuthMiddleware, getCartDetails)
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
router.delete("/cart/:cartId", userAuthMiddleware, deleteFromCart);

export default router;
