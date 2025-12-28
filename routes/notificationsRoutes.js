import { Router } from 'express';
import { userAuthMiddleware } from '../middlewares/authMiddleware.js';
import { getUserNotifications, markNotificationRead } from '../controllers/notficationsControllers.js';

const router = Router()

router.get("/", userAuthMiddleware, getUserNotifications)
router.post("/:id", userAuthMiddleware, markNotificationRead)


export default router