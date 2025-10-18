import { uploader } from "../configs/cloudinaryConfigs.js";
import { cleanUpStorage } from "../utils/usersUtilFns.js";

const handleProductImageUpload = async (req, res, next) => {
  try {
	if (!req.files || req.files.length <= 0) next()
    const imagesInfo = await Promise.all(req.files.map(async ({ path }, index) => {
      if (index + 1 <= 5) {
        const uploadedImage = await uploader.upload(path, {
          folder: `lasu_mart/products/${index}`,
        });
        return {
          url: uploadedImage.secure_url,
          publicId: uploadedImage.public_id,
        };
      }
    }));
	console.log(imagesInfo, "log imdddd")
    req.images = imagesInfo;
    //cleanUpStorage();
    next();
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

export { handleProductImageUpload };
