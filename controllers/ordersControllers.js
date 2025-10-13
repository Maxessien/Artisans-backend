import { Order } from "../models/ordersModel.js";
import { User } from "../models/usersModel.js";
import { populateUserCart } from "./../utils/usersUtilFns.js";

const placeOrders = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.auth.uid })
      .select("cart")
      .lean();
	console.log(user, "user")
    const populatedCart = await populateUserCart(user.cart);
	console.log(populatedCart, "cart")
    populatedCart.forEach(async (product) => {
      await Order.insertOne({
        productId: product.productId,
        name: product.name,
        price: product.price,
        variant: req.body.variant ?? null,
        vendorId: product.vendorId,
        quantityOrdered: product.quantity,
        userId: req.auth.uid,
        address: req.body.address,
        customerContactInfo: {
          email: req.body.email ?? null,
          phone: req.body.phone,
        },
        paymentMethod: req.body.paymentMethod,
      });
    });
	const orders = await Order.find().lean()
	console.log(orders)
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const cancelOrder = async(req, res)=>{
    try{
        const getOrder = await Order.findOne({orderId: req.body.orderId}).select("userId").lean()
        if (req.auth.uid !== getOrder.userId) throw new Error("Unauthorised user")
        const updatedOrder = await Order.updateOne({orderId: req.body.orderId}, {paymentStatus: "incomplete", deliveryStatus: "cancelled"})
        return res.status(200).json({message: "Order cancelled successfully"})
    }catch(err){
        console.log(err)
        return res.status(500).json({message: "Server error"})
    }
}



export {placeOrders, cancelOrder}