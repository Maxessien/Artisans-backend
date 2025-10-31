import { Order } from "../models/ordersModel.js";
import { User } from "../models/usersModel.js";
import { populateUserCart } from "./../utils/usersUtilFns.js";

const placeOrders = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.auth.uid })
      .lean();
    console.log(user, "user");
    const populatedCart = await populateUserCart(user.cart);
    console.log(populatedCart, "cart");
    const ordersArray = populatedCart.map((product) => {
      return {
        productId: product.productId,
        name: product.name,
        price: product.price,
        ...(req.body.variant ? { variant: req.body.variant } : {}),
        vendorId: product.vendorId,
        quantityOrdered: product.quantity,
        userId: user.userId,
        address: req.body.address,
        customerContactInfo: {
          email: user.email,
          phone: user.phoneNumber,
        },
      };
    });
    await Order.insertMany(ordersArray);
    const orders = await Order.find().lean();
    console.log(orders);
    return res.status(201).json({ message: "Order Created" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const getOrderHistory = async (req, res) => {
  try {
    const {
      orderBy = "createdAt",
      direction = "desc",
      status = ["pending", "completed", "cancelled"],
      limit=20
    } = req.query;
    const orders = await Order.find({
      userId: { $in: req.auth.uid },
      deliveryStatus: { $in: status },
    })
      .sort({[orderBy]: direction}).limit(limit)
      .lean();
    console.log(orders);
    return res.status(200).json(orders);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const getOrder = await Order.findOne({ orderId: req.params.orderId })
      .select("userId")
      .lean();
    if (req.auth.uid !== getOrder.userId) throw new Error("Unauthorised user");
    const updatedOrder = await Order.updateOne(
      { orderId: req.params.orderId },
      { deliveryStatus: "cancelled" }
    );
    return res.status(200).json({ message: "Order cancelled successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const getVendorOrders = async (req, res) => {
  try {
    const {
      orderBy = "createdAt",
      direction = "desc",
      status = ["pending", "completed", "cancelled"],
      limit=20,
      page=1
    } = req.query;
    const orders = await Order.find({
      vendorId: req.auth.uid,
      deliveryStatus: { $in: status },
    })
      .sort({[orderBy]: direction}).limit(limit).skip((page-1)*limit)
      .lean();
    return res.status(200).json(orders);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const getOrder = await Order.findOne({ orderId: req.body.orderId })
      .select("vendorId")
      .lean();
    if (req.auth.uid !== getOrder.vendorId)
      throw new Error("Unauthorised user");
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId: req.body.orderId },
      { deliveryStatus: req.body.deliveryStatus }
    );
    return res.status(200).status(updatedOrder);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

export {
  placeOrders,
  cancelOrder,
  getOrderHistory,
  getVendorOrders,
  updateOrderStatus,
};
