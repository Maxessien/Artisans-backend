import { findError } from "../fbAuthErrors.js";
import { auth } from "../configs/fbConfigs.js";
import { User } from "../models/usersModel.js";
import { generateOtp, populateUserCart } from "../utils/usersUtilFns.js";
import { AuthOtp } from "../models/authOtpModel.js";

const createUser = async (req, res) => {
  try {
    const user = await auth.createUser(req.body);
    await auth.setCustomUserClaims(user.uid, { role: "user", isVerified: {email: true, phone: true} });
    const dbStore = await User.create({
      userId: user.uid,
      email: user.email,
      phoneNumber: user.phoneNumber,
      displayName: user.displayName,
    });
    console.log(dbStore);
    return res.status(201).json({ message: "Account created successfully" });
  } catch (err) {
    console.log(err);
    const errorMessage = findError(err.code);
    console.log(errorMessage);
    return res.status(errorMessage?.statusCode || 500).json({
      message: errorMessage?.customMessage || "Server error, try again later",
    });
  }
};

const getUser = async (req, res) => {
  try {
    const uid = req.auth.uid;
    const user = await User.findOne({ userId: uid }).lean();
    if (!user) throw new Error("User not found");
    const populatedCart = await populateUserCart(user.cart);
    return res.status(202).json({ ...user, cart: populatedCart });
  } catch (err) {
    console.log(err);
    return res.status(404).json({ message: "User not found" });
  }
};

const updateUser = async (req, res) => {
  try {
    console.log(req.auth);
    if (!req.query?.type || req.query?.type !== "dbOnly") {
      const user = await auth.updateUser(req.auth.uid, req.body);
    }
    if(!req.query?.type || req.query?.type !== "authOnly"){
      const updatedUser = await User.findOneAndUpdate(
        { userId: req.auth.uid },
        req.body,
        { new: true }
      ).lean();
      return res.status(200).json({ ...updatedUser });
    }
    return res.status(200).json({message: "Update Successful"})
  } catch (err) {
    const errorMessage = findError(err.code);
    console.log(errorMessage);
    return res.status(errorMessage?.statusCode || 500).json({
      message: errorMessage?.customMessage || "Server error, try again later",
    });
  }
};

const verifyUserCookie = async(req, res)=>{
  try{
    const user = await User.findOne({userId: req.auth.uid}).lean()
    return res.status(200).json({...req.auth, ...user})
  }catch(err){
    console.log(err)
    return res.status(500).json({message: "Server error"})
  }
}

const setLoggedInUserCookie = async(req, res)=>{
	const isDevelopment = process.env.NODE_ENV==="development"
  try {
	console.log(req.body)
    res.cookie("userSessionToken", req.body.idToken, {
      maxAge: 1000*60*60,
      path: "/",
      httpOnly: true,
	secure: !isDevelopment,
      sameSite: isDevelopment ? "lax" : "none"
    })
    res.status(200).json({message: "Cookie set successfully"})
  } catch (err) {
    console.log(err)
    res.status(500).json({message: "Server error"})
  }
}

const sendOtp = async(req, res)=>{
  try{
    const value = await generateOtp(req.body.type, req.body.value)
    console.log(value)
  }catch(err){
    console.log(err)
    res.status(500).json(err)
  }
}

const verifyOtp = async(req, res)=>{
    try{
        const {value, expiryTime, reciever} = await AuthOtp.findOne({value: req.body.otpValue}).lean()
        const stillValid = expiryTime ? expiryTime - Date.now() > 10000 : false
        if(!value || !stillValid || req.auth[req.body.type] !== reciever) throw new Error("Invalid Otp")
        res.status(200).json({message: "Verfication successful"})
    }catch(err){
        console.log(err)
        res.status(500).json(err)
    }
}

export {
  createUser,
  updateUser,
  getUser,
  setLoggedInUserCookie,
  verifyUserCookie,
  sendOtp,
  verifyOtp,
};
