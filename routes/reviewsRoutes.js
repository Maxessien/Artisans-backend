import { Router } from "express";
import { userAuthMiddleware, verifyAdmin } from "../middlewares/authMiddleware";
import { addReview, deleteReview, getProductReviews } from "../controllers/reviewsControllers";


const router = Router()

router.get("/:id", getProductReviews)
router.post("/", userAuthMiddleware, addReview)
router.delete("/:id", userAuthMiddleware, verifyAdmin, deleteReview)


export default router