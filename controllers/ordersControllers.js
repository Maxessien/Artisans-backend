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
    const ordersArray = populatedCart.map(async (product) => {
      return {
        productId: product.productId,
        name: product.name,
        price: product.price,
        ...(req.body.variant ? {variant: req.body.variant} : {}),
        vendorId: product.vendorId,
        quantityOrdered: product.quantity,
        userId: req.auth.uid,
        address: req.body.address,
        customerContactInfo: {
          email: req.auth.email,
          phone: req.body.phone,
        },
        paymentMethod: req.body.paymentMethod,
      }
    });
    await Order.insertMany(ordersArray);
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