import emailjs from "@emailjs/nodejs";
import crypto from "crypto";
import { auth } from "../configs/fbConfigs.js";
import { findError } from "../fbAuthErrors.js";
import logger from "../utils/logger.js";
import pool from "./../configs/sqlConnection";

const createUser = async (req, res) => {
  try {
    logger.log("createUser body", req.body);
    const user = await auth.createUser({
      ...req.body,
      phoneNumber: `+234${req.body.phoneNumber}`,
    });
    await auth.setCustomUserClaims(user.uid, {
      role: "user",
      isVerified: { email: false, phone: false },
    });
    const query =
      "INSERT INTO users (user_id, email, display_name, phone_number, role) VALUES ($1, $2, $3, $4, $5) RETURNING *";
    const dbStore = await pool.query(query, [
      user.uid,
      user.email,
      user.displayName,
      user.phoneNumber,
      "user",
    ]);
    logger.log("createUser dbStore", dbStore);
    return res.status(201).json({ message: "Account created successfully" });
  } catch (err) {
    logger.error("createUser error", err);
    const errorMessage = findError(err.code);
    logger.log("createUser errorMessage", errorMessage);
    return res.status(errorMessage?.statusCode || 500).json({
      message: errorMessage?.customMessage || "Server error, try again later",
    });
  }
};

const getUser = async (req, res) => {
  try {
    const uid = req.auth.uid;
    const query = `SELECT users.user_id, email, display_name, phone_number, picture_url, preferred_payment_method,
                    (SELECT COUNT(*) FROM carts WHERE carts.user_id = $1) AS total_cart_items
                    FROM users WHERE users.user_id = $1`;
    const user = await pool.query(query, [uid]);
    return res.status(202).json(user.rows[0] || []);
  } catch (err) {
    logger.error("getUser error", err);
    return res.status(404).json({ message: "User not found" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { displayName, address, preferredPaymentMethod } = req.body;
    const query =
      "UPDATE users SET display_name = $1, address = $2, preferred_payment_method = $3 WHERE user_id = $4 RETURNING *";
    const updatedUser = await pool.query(query, [
      displayName,
      address,
      preferredPaymentMethod,
      req.auth.uid,
    ]);
    return res.status(200).json(updatedUser.rows[0] || {});
  } catch (err) {
    const errorMessage = findError(err.code);
    logger.log("updateUser errorMessage", errorMessage);
    return res.status(errorMessage?.statusCode || 500).json({
      message: errorMessage?.customMessage || "Server error, try again later",
    });
  }
};

const verifyUserCookie = async (req, res) => {
  try {
    const uid = req.auth.uid;
    const query = `SELECT users.user_id, email, display_name, phone_number, picture_url, preferred_payment_method,
                    (SELECT COUNT(*) FROM carts WHERE carts.user_id = $1) AS total_cart_items
                    FROM users WHERE users.user_id = $1`;
    const user = await pool.query(query, [uid]);
    return res.status(200).json({ ...req.auth, ...(user.rows[0] || {}) });
  } catch (err) {
    logger.error("verifyUserCookie error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const setLoggedInUserCookie = async (req, res) => {
  const isDevelopment = process.env.NODE_ENV === "development";
  try {
    logger.log("setLoggedInUserCookie body", req.body);
    res.cookie("userSessionToken", req.body.idToken, {
      maxAge: 1000 * 60 * 60,
      path: "/",
      httpOnly: true,
      secure: !isDevelopment,
      sameSite: isDevelopment ? "lax" : "none",
    });
    return res.status(200).json({ message: "Cookie set successfully" });
  } catch (err) {
    logger.error("setLoggedInUserCookie error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteUserCookie = async (req, res) => {
  const isDevelopment = process.env.NODE_ENV === "development";
  try {
    logger.log("deleteUserCookie body", req.body);
    res.clearCookie("userSessionToken", {
      maxAge: 0,
      path: "/",
      httpOnly: true,
      secure: !isDevelopment,
      sameSite: isDevelopment ? "lax" : "none",
    });
    return res.status(200).json({ message: "Cookie deleted successfully" });
  } catch (err) {
    logger.error("deleteUserCookie error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const sendOtp = async (req, res) => {
  try {
    const { type, reciever } = req.body;
    const value = crypto.randomInt(100000, 1000000).toString();
    const data = await pool.query(
      "INSERT INTO auth_otps (receiver, otp_type, value) VALUES ($1, $2, $3) RETURNING *",
      [reciever, type, value]
    );
    logger.log("sendOtp result", data);
    if (req.body.type === "email" && process.env.NODE_ENV !== "development") {
      await emailjs.send(
        process.env.EMAILJS_SERVICE_ID,
        process.env.EMAILJS_TEMPLATE_ID,
        {
          email: reciever,
          passcode: value,
          time: "5 minutes",
          companyName: "Lasu Mart",
        }
      );
    }
    return res.status(201).json({ message: "Otp sent" });
  } catch (err) {
    logger.error("sendOtp error", err);
    return res.status(500).json(err);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const query = `SELECT value, otp_type, receiver FROM auth_otps WHERE value = $1 AND expiry_time > NOW()`;
    const otp = await pool.query(query, [req.body.otpValue]);
    const isValid = otp?.rows?.length > 0;
    if (!isValid) throw new Error("Invalid OTP");
    const user = await pool.query(
      `SELECT user_id FROM users WHERE ${
        otp.rows[0].otp_type === "email" ? "email = $1" : "phone_number = $1"
      }`,
      [otp.rows[0].receiver]
    );
    // Fetch existing custom claims using Admin SDK
    const userRecord = await auth.getUser(user.rows[0].user_id);
    const existingClaims = userRecord.customClaims || {};
    const existingVerified = existingClaims.isVerified || { email: false, phone: false };
    
    // Merge with new verification
    await auth.setCustomUserClaims(user.rows[0].user_id, {
      role: "user",
      isVerified: {
        ...existingVerified,
        ...(otp.rows[0].otp_type === "email" ? { email: true } : { phone: true }),
      },
    });
    await pool.query("DELETE FROM auth_otps WHERE value = $1", [
      req.body.otpValue,
    ]);
    return res.status(200).json({ message: "Verification successful" });
  } catch (err) {
    logger.error("verifyOtp error", err);
    return res.status(500).json(err);
  }
};

export {
  createUser, deleteUserCookie, getUser, sendOtp, setLoggedInUserCookie, updateUser, verifyOtp, verifyUserCookie
};

