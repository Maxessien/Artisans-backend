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

const getCartDetails = async(req, res)=>{
  try {
    const query = `SELECT c.cart_id, c.product_id, c.quantity, p.product_name, p.price, jsonb_agg(i.image_url) AS images
                    FROM carts AS c
                    JOIN products AS p ON c.product_id = p.product_id
                    JOIN product_images AS i ON c.product_id = i.product_id
                    WHERE c.user_id = $1`
    const cartDetails = pool.query(query, [req.auth.uid])
    return res.status(200).json(cartDetails?.rows ?? [])
  } catch (err) {
    logger.error("Get cart details error", err)
    return res.status(500).json({message: "Server Error"})
  }
}

const deleteFromCart = async (req, res) => {
  try {
    await pool.query("DELETE FROM carts WHERE cart_id = $1", [
      req.params.cartId,
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
    const errorMessage = findError(err?.code);
    logger.log("uploadUserProfilePhoto errorMessage", errorMessage);
    return res.status(errorMessage?.statusCode || 500).json({
      message: errorMessage?.customMessage || "Server error, try again later",
    });
  }
};

export { addToCart, deleteFromCart, uploadUserProfilePhoto, getCartDetails };

