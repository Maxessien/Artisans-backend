import express from "express"
import { createUser, sendOtp, setLoggedInUserCookie, verifyOtp, verifyUserCookie } from "../controllers/userAuthControllers.js";
import { userAuthMiddleware } from "../middlewares/authMiddleware.js";


const router = express.Router()

router.post("/register", createUser);
router.get("/verify", userAuthMiddleware, verifyUserCookie);
router.post("/login", setLoggedInUserCookie);
router.post("/otp", userAuthMiddleware, sendOtp)
router.post("/otp/verify", userAuthMiddleware, verifyOtp)

export default router