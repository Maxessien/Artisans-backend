import express from "express"
import { cancelOrder, getOrderHistory, getSingleOrder, getVendorOrders, placeOrders, updateOrderStatus } from "../controllers/ordersControllers.js"
import { userAuthMiddleware } from "../middlewares/authMiddleware.js"

const  router = express.Router()
router.use(userAuthMiddleware)

//router.get("/")
//router.get("/:id")
router.get("/user", userAuthMiddleware, getOrderHistory)
router.post("/user", userAuthMiddleware, placeOrders)
router.get("/user/:orderId", userAuthMiddleware, getSingleOrder)
router.delete("/user/:orderId", userAuthMiddleware, cancelOrder)
router.get("/vendor", userAuthMiddleware, getVendorOrders)
router.post("/vendor/:id/status", userAuthMiddleware, updateOrderStatus)

export default router