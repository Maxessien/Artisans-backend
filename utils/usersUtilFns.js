import fs from "fs";
import multer from "multer";
import crypto from "crypto";
import emailjs from '@emailjs/nodejs';

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

const userAllowedFields = (exclusions) => {
  if (!Array.isArray(exclusions) && typeof exclusions !== "string")
    throw new Error("exclusions must be a string or Array of strings");
  const defaultFields = [
    "displayName",
    "userId",
    "profilePicture",
    "email",
    "phoneNumber",
    "cart",
    "orderHistory",
    "following",
    "wishlist",
    "reviewsMade",
    "orderPoints",
  ];
  const filtered = defaultFields.filter((field) => {
    if (Array.isArray(exclusions)) return !exclusions.includes(field);
    if (typeof exclusions === "string") return field !== exclusions;
  });
  return filtered;
};

const generateUUID = () => {
  return crypto.randomUUID();
};

const addedProductEmail = async (name, category, price) => {
  try {
    await emailjs.send(process.env.EMAILJS_SERVICE_ID, "template_41f8lkx", {
      product_name: name,
      product_category: category,
      product_price: price,
      review_link: "https://github.com/Maxessien",
    });
  } catch (err) {
    console.log(err);
    throw err;
  }
};

/**
 * @param {Number} start - Inclusive start param index 
 * @param {Array} array - 1D Array to create SQL params from
 *
 * @returns {String} - String SQL param e.g ($1, $2, $3)
 */
const genParamsFromArray = (start=1, array) => {
  let paramStr = "";
  array.forEach((_, index) => {
    paramStr += `$${
      index + 1 === array.length ? start + index + 1 : `${start + index + 1},`
    }`;
  });
  return `(${paramStr})`;
};

export {
  upload,
  cleanUpStorage,
  userAllowedFields,
  generateUUID,
  addedProductEmail,
  genParamsFromArray,
};
