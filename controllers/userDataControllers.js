import { uploader } from "../configs/cloudinaryConfigs.js";
import pool from "../configs/sqlConnection.js";
import { findError } from "../fbAuthErrors.js";

const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const { id } = req.params;
    const existsInCart = await pool.query(
      "SELECT userId FROM carts WHERE productId = $1 AND userId = $2",
      [productId, id]
    );
    const query =
      existsInCart?.rows?.length > 0
        ? `UPDATE carts SET quantity = quantity + $2 WHERE productId = $1 AND userId = $3`
        : `INSERT INTO carts (productId, quantity, userId) VALUES ($1, $2, $3)`;
    await pool.query(query, [productId, quantity, id]);
    return res.status(200).json({ message: "Added Successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteFromCart = async (req, res) => {
  try {
    await pool.query("DELETE FROM carts WHERE productId = $1 AND userId = $2", [
      req.params.productId,
      req.params.id,
    ]);
    return res.status(200).json({ message: "Deleted Successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const uploadUserProfilePhoto = async (req, res) => {
  try {
    const query = "SELECT picturePublicId FROM users WHERE userId = $1";
    const profilePhotoDb = await pool.query(query, [req.auth.uid]);
    const isUpdate =
      profilePhotoDb?.rows[0].picturePublicId !== "default_public_id";
    const { secure_url, public_id } = await uploader.upload(req.file.path, {
      folder: isUpdate
        ? profilePhotoDb?.rows[0].picturePublicId
        : "lasu_mart/user_profile_photos",
    });
    const updateQuery =
      "UPDATE users SET pictureUrl = $1, picturePublicId = $2 WHERE userId = $3";
    await pool.query(updateQuery, [
      secure_url,
      public_id,
      req.auth.uid,
    ]);
    // cleanUpStorage(req.file.path);
    return res.status(201).json({ message: "Update successfully" });
  } catch (err) {
    console.log(err);
    const errorMessage = findError(err.code);
    console.log(errorMessage);
    return res.status(errorMessage?.statusCode || 500).json({
      message: errorMessage?.customMessage || "Server error, try again later",
    });
  }
};

export { addToCart, deleteFromCart, uploadUserProfilePhoto };
