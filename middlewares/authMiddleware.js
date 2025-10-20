import { auth } from "../configs/fbConfigs.js";
import { Product } from "../models/productsModel.js";

const userAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.Authorization || req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader?.split("Bearer ")[1] || ""
    : null;
  if (!token) throw new Error("Unauthorised access");
  try {
    const decodedToken = await auth.verifyIdToken(token);
    if ("user" != decodedToken.role || !decodedToken) {
      throw new Error("Unauthorised access");
    } else {
      req.auth = decodedToken;
	console.log(decodedToken, "token token")
      next();
    }
  } catch (err) {
    console.log(err, "error");
    return res.status(400).json({ message: "Unauthorised access at catch" });
  }
};

const verifyVendorOwnership = async(req, res, next)=>{
  try{
    const {email, phone} = req.auth.isVerified
    if (!email || !phone) throw new Error("Unverified vendor")
    const product = await Product.findOne({productId: req.query.productId}).select("vendorId").lean()
	console.log(req.query.id, product, "pehdfncb")
    if (req.auth.uid !== product.vendorId) throw new Error("Unauthorised access")
    next()
  }catch(err){
    console.log(err)
    return res.status(400).json({message: "Unauthorised access"})
  }
}

export { userAuthMiddleware, verifyVendorOwnership };
