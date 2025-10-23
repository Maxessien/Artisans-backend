import express from "express"
import { cancelOrder, getOrderHistory, getVendorOrders, placeOrders, updateOrderStatus } from "../controllers/ordersControllers.js"
import { userAuthMiddleware } from "../middlewares/authMiddleware.js"

const  router = express.Router()
router.use(userAuthMiddleware)

//router.get("/")
//router.get("/:id")
router.get("/user/:userId", getOrderHistory)
router.post("/user/:userId", placeOrders)
router.delete("/user/:orderId", cancelOrder)
router.get("/vendor", getVendorOrders)
router.post("/vendor/:id/status", updateOrderStatus)

export default router