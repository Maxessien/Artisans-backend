import { Router } from "express";
import { userAuthMiddleware, verifyAdmin } from "../middlewares/authMiddleware.js";
import { addReview, deleteReview, getProductReviews } from "../controllers/reviewsControllers.js";


const router = Router()

router.get("/:id", getProductReviews)
router.post("/", userAuthMiddleware, addReview)
router.delete("/:id", userAuthMiddleware, verifyAdmin, deleteReview)


export default router