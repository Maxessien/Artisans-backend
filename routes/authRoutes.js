import express from "express";
import {
  createUser,
  sendOtp,
  setLoggedInUserCookie,
  deleteUserCookie,
  verifyOtp,
  verifyUserCookie,
} from "../controllers/userAuthControllers.js";
import { userAuthMiddleware } from "../middlewares/authMiddleware.js";
import { requestBodyFieldsFilter } from "../middlewares/regMiddleware.js";

const router = express.Router();

router.post(
  "/register",
  requestBodyFieldsFilter(["displayName", "email", "phoneNumber", "password"]),
  createUser
);
router.get("/verify", userAuthMiddleware, verifyUserCookie);
router.post("/login", setLoggedInUserCookie);
router.delete("logout", deleteUserCookie)
router.post("/otp", userAuthMiddleware, sendOtp);
router.post("/otp/verify", userAuthMiddleware, verifyOtp);

export default router;
