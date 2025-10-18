import { User } from "../models/usersModel.js";
import { Order } from "../models/ordersModel.js";
import { populateUserCart } from "../utils/usersUtilFns.js";

const addToCart = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.auth.uid });
    const existing = user.cart.find(
      (item) => item.productId === req.body.productId
    );
    const newCart = existing
      ? user.cart.map((item) => {
          if (item.productId === req.body.productId) {
            item.quantity += req.body.quantity;
          }
          return item;
        })
      : [...user.cart, req.body];
    const updatedUser = await User.findOneAndUpdate(
      { userId: req.auth.uid },
      { cart: newCart },
      { new: true }
    ).lean();
    console.log(updatedUser);
    const populatedCart = await populateUserCart(updatedUser.cart);
    return res.status(201).json({ ...updatedUser, cart: populatedCart });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteFromCart = async (req, res) => {
  try {
    console.log(req.query);
    const user = await User.findOne({ userId: req.auth.uid }).lean();
    const newCart = user.cart.filter((item) => {
      return item.productId !== req.query.productId;
    });
    console.log(newCart);
    const updatedUser = await User.findOneAndUpdate(
      { userId: req.auth.uid },
      { cart: newCart },
      { new: true }
    ).lean();
    const populatedCart = await populateUserCart(updatedUser.cart);
    return res.status(201).json({ ...updatedUser, cart: populatedCart });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const getOrderHistory = async (req, res) => {
  try {
    const orders = await Order.find({ userId: { $in: req.auth.uid } }).lean();
    console.log(orders);
    return res.status(200).json(orders);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const uploadUserProfilePhoto = async (req, res) => {
  console.log("Visited upload");
  try {
    const profilePhotoDb = await User.findOne({ userId: req.auth.uid }).select(
      "profilePicture"
    );
    const isUpdate = profilePhotoDb?.profilePicture.url !== "default_public_id";
    const uploadedImage = await uploader.upload(req.file.path, {
      folder: isUpdate
        ? profilePhotoDb?.profilePicture.publicId
        : "lasu_mart/user_profile_photos",
    });
    const storedInDb = await User.findOneAndUpdate(
      { userId: req.auth.uid },
      {
        profilePicture: {
          url: uploadedImage.secure_url,
          publicId: uploadedImage.public_id,
        },
      },
      { new: true }
    );
    cleanUpStorage();
    console.log(storedInDb);
    return res.status(201).json(storedInDb);
  } catch (err) {
    console.log(err);
    const errorMessage = findError(err.code);
    console.log(errorMessage);
    return res.status(errorMessage?.statusCode || 500).json({
      message: errorMessage?.customMessage || "Server error, try again later",
    });
  }
};

const deleteUserProfilePhoto = async (req, res) => {
  try {
    const profilePhotoDb = await User.findOne({ userId: req.auth.uid }).select(
      "profilePicture"
    );
    await uploader.destroy(profilePhotoDb.publicId);
    const updatedUserDb = await User.findOneAndUpdate(
      { userId: req.auth.uid },
      {
        profilePicture: {
          url: "default",
          publicId: "default_public_id",
        },
      },
      { new: true }
    );
    res.status(201).json(updatedUserDb);
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Failed to delete image, try again later" });
  }
};

export {
  addToCart,
  deleteFromCart,
  getOrderHistory,
  uploadUserProfilePhoto,
  deleteUserProfilePhoto,
};
