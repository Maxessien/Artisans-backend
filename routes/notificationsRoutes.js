import { Router } from 'express';
import { userAuthMiddleware } from '../middlewares/authMiddleware';
import { getUserNotifications, markNotificationRead } from '../controllers/notficationsControllers';

const router = Router()

router.get("/", userAuthMiddleware, getUserNotifications)
router.post("/:id", userAuthMiddleware, markNotificationRead)


export default router