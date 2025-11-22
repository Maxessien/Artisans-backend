import fs from "fs";
import path from "path";
import multer from "multer";
import { Product } from "../models/productsModel.js";

const upload = multer({ dest: "uploads" });

/**
 *
 * @param {string|Array} pathToFiles - String or Array of strings path to the file
 */
const cleanUpStorage = (pathToFiles) => {
  try {
    if (!Array.isArray(pathToFiles) && typeof pathToFiles !== "string")
      throw new Error("Path to file must be a string or array of strings");
    if (Array.isArray(pathToFiles))
      pathToFiles.forEach((path) => fs.rmSync(path));
    if (typeof pathToFiles === "string") fs.rmSync(pathToFiles);
    return { success: "ok" };
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const populateUserCart = async (userCart) => {
  try {
    console.log(userCart);
    if (!userCart || userCart?.length <= 0) return [];
    const productsId = userCart.map((cartItem) => cartItem.productId);
    const products = await Product.find({
      productId: { $in: productsId },
    }).lean();
    if (!products || products?.length <= 0) return [];
    const productsMap = new Map(
      products.map((product) => [product.productId, product])
    );
    const newUserCart = userCart.map((cartItem) => {
      const productObj = productsMap.get(cartItem.productId);
      if (productObj) {
        return { ...cartItem, ...productObj };
      }
    });
    return newUserCart;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

export { upload, cleanUpStorage, populateUserCart };
