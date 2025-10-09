import { findError } from "../fbAuthErrors.js";
import { auth } from "../configs/fbConfigs.js";
import { User } from "../models/usersModel.js";
import { uploader } from "../configs/cloudinaryConfigs.js";
import { cleanUpStorage, populateUserCart } from "../utils/usersUtilFns.js";

const createUser = async (req, res) => {
  try {
    const user = await auth.createUser(req.body);
    await auth.setCustomUserClaims(user.uid, { role: "user" });
    console.log(user, "user");
    const dbStore = await User.create({
      userId: user.uid,
      email: user.email,
      displayName: user.displayName,
      phoneNumber: user.phoneNumber,
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
  console.log("fetting");
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
    const updatedUser = await User.findOneAndUpdate(
      { userId: req.auth.uid },
      req.body,
      { new: true }
    ).lean();
    return res.status(201).json({ ...updatedUser });
  } catch (err) {
    const errorMessage = findError(err.code);
    console.log(errorMessage);
    return res.status(errorMessage?.statusCode || 500).json({
      message: errorMessage?.customMessage || "Server error, try again later",
    });
  }
};

const uploadUserProfilePhoto =
  () =>
  async (req, res) => {
    console.log("Visited upload");
    try {
       const profilePhotoDb = await User.findOne({ userId: req.auth.uid }).select(
          "profilePicture"
        );
        const isUpdate = profilePhotoDb?.profilePicture.url !== "default_public_id"
      const uploadedImage = await uploader.upload(req.file.path, {
        folder:
          isUpdate ? profilePhotoDb?.profilePicture.publicId :
          "lasu_mart/user_profile_photos",
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

export {
  createUser,
  updateUser,
  uploadUserProfilePhoto,
  deleteUserProfilePhoto,
  getUser,
  setLoggedInUserCookie,
};
