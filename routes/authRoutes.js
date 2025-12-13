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
import { requestFieldsFilter } from "../middlewares/regMiddleware.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

router.post(
  "/register",
  requestFieldsFilter(["displayName", "email", "phoneNumber", "password"]),
  createUser
);
router.get("/verify", userAuthMiddleware, verifyUserCookie);
router.post("/login", setLoggedInUserCookie);
router.delete("/logout", deleteUserCookie);
router.post(
  "/otp",
  rateLimit({ windowMs: 60 * 1000, limit: 1, standardHeaders: true }),
  sendOtp
);
router.post("/otp/verify", verifyOtp);

export default router;
