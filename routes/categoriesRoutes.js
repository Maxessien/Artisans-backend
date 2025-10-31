import express from "express";
import { addCategory, deleteCategory, getCategories } from "../controllers/categoriesControllers.js";
import { userAuthMiddleware, verifyAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router()

router.get("/", getCategories)
router.post("/", userAuthMiddleware, verifyAdmin, addCategory)
router.delete("/:id", userAuthMiddleware, verifyAdmin, deleteCategory)

export default router