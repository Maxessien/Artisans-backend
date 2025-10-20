import { findError } from "../fbAuthErrors.js";
import { auth } from "../configs/fbConfigs.js";
import { User } from "../models/usersModel.js";
import { populateUserCart, emailJsLogoSvg } from "../utils/usersUtilFns.js";
import { AuthOtp } from "../models/authOtpModel.js";
import emailjs from "@emailjs/nodejs"

const createUser = async (req, res) => {
  try {
    const user = await auth.createUser({...req.body, phoneNumber: `+234${req.body.phoneNumber}`});
    await auth.setCustomUserClaims(user.uid, { role: "user", isVerified: {email: false, phone: true} });
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
    if (!req.query?.type || req.query?.type !== "authOnly") {
      const updatedUser = await User.findOneAndUpdate(
        { userId: req.auth.uid },
        req.body,
        { new: true }
      ).lean();
      return res.status(200).json({ ...updatedUser });
    }
    return res.status(200).json({ message: "Update Successful" });
  } catch (err) {
    const errorMessage = findError(err.code);
    console.log(errorMessage);
    return res.status(errorMessage?.statusCode || 500).json({
      message: errorMessage?.customMessage || "Server error, try again later",
    });
  }
};

const verifyUserCookie = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.auth.uid }).lean();
    return res.status(200).json({ ...req.auth, ...user });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const setLoggedInUserCookie = async (req, res) => {
  const isDevelopment = process.env.NODE_ENV === "development";
  try {
    console.log(req.body);
    res.cookie("userSessionToken", req.body.idToken, {
      maxAge: 1000 * 60 * 60,
      path: "/",
      httpOnly: true,
      secure: !isDevelopment,
      sameSite: isDevelopment ? "lax" : "none",
    });
    res.status(200).json({ message: "Cookie set successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

const sendOtp = async (req, res) => {
  try {
      console.log(req.body, "bodyyyyyy")
      const data = await AuthOtp.create({otpType: req.body.type, reciever: req.body.value})
      if(req.body.type==="email" && process.env.NODE_ENV!=="development"){
        await emailjs.send(process.env.EMAILJS_SERVICE_ID, process.env.EMAILJS_TEMPLATE_ID, {
                email: req.body.value,
                svgCode: emailJsLogoSvg,
                passcode: data.value,
                time: "5 minutes",
                companyName: "Lasu Mart"
              })
      }
    console.log(data);
	  return res.status(201).json({message: "Otp sent"})
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

const verifyOtp = async (req, res) => {
  try {
	console.log(req.auth, "anshshdhdh")
    const { value, expiryTime, reciever } = await AuthOtp.findOne({
      value: req.body.otpValue,
    }).lean();
    const stillValid = expiryTime ? expiryTime - Date.now() > 10000 : false;
	console.log(value, expiryTime, Date.now(), stillValid, req.auth["phone_number"], reciever, "alllllll")
    if (!value || !stillValid || req.auth[req.body.type==="phoneNumber" ? "phone_number" : "email"] !== reciever)
      throw new Error("Invalid Otp");
    await auth.setCustomUserClaims(req.auth.uid, {
	role: "user",
      isVerified: {
        ...req.auth.isVerified,
	...(req.body.type==="email" ? {email: true} : {phone: true})
      },
    });
    res.status(200).json({ message: "Verfication successful" });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

export {
  createUser,
  updateUser,
  getUser,
  setLoggedInUserCookie,
  verifyUserCookie,
  sendOtp,
  verifyOtp,
};
