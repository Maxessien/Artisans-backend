import { uploader } from "../configs/cloudinaryConfigs.js";
import pool from "../configs/sqlConnection.js";
import { findError } from "../fbAuthErrors.js";
import logger from "../utils/logger.js";

const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const { id } = req.params;
    const existsInCart = await pool.query(
      "SELECT user_id FROM carts WHERE product_id = $1 AND user_id = $2",
      [productId, id]
    );
    const query =
      existsInCart?.rows?.length > 0
        ? `UPDATE carts SET quantity = quantity + $2 WHERE product_id = $1 AND user_id = $3`
        : `INSERT INTO carts (product_id, quantity, user_id) VALUES ($1, $2, $3)`;
    await pool.query(query, [productId, quantity, id]);
    return res.status(200).json({ message: "Added Successfully" });
  } catch (err) {
    logger.error("addToCart error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteFromCart = async (req, res) => {
  try {
    await pool.query("DELETE FROM carts WHERE product_id = $1 AND user_id = $2", [
      req.params.productId,
      req.params.id,
    ]);
    return res.status(200).json({ message: "Deleted Successfully" });
  } catch (err) {
    logger.error("deleteFromCart error", err);
    return res.status(500).json({ message: "Server error" });
  }
};

const uploadUserProfilePhoto = async (req, res) => {
  try {
    const query = "SELECT picture_public_id FROM users WHERE user_id = $1";
    const profilePhotoDb = await pool.query(query, [req.auth.uid]);
    const isUpdate =
      profilePhotoDb?.rows[0].picture_public_id !== "default_public_id";
    const { secure_url, public_id } = await uploader.upload(req.file.path, {
      folder: isUpdate
        ? profilePhotoDb?.rows[0].picture_public_id
        : "lasu_mart/user_profile_photos",
    });
    const updateQuery =
      "UPDATE users SET picture_url = $1, picture_public_id = $2 WHERE user_id = $3";
    await pool.query(updateQuery, [
      secure_url,
      public_id,
      req.auth.uid,
    ]);
    // cleanUpStorage(req.file.path);
    return res.status(201).json({ message: "Update successfully" });
  } catch (err) {
    logger.error("uploadUserProfilePhoto error", err);
    const errorMessage = findError(err.code);
    logger.log("uploadUserProfilePhoto errorMessage", errorMessage);
    return res.status(errorMessage?.statusCode || 500).json({
      message: errorMessage?.customMessage || "Server error, try again later",
    });
  }
};

export { addToCart, deleteFromCart, uploadUserProfilePhoto };

