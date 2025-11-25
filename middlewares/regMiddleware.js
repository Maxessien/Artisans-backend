import { uploader } from "../configs/cloudinaryConfigs.js";
import { cleanUpStorage } from "../utils/usersUtilFns.js";

const handleProductImageUpload = async (req, res, next) => {
  try {
	if (!req.files || req.files.length <= 0) return next()
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
    //cleanUpStorage(req.files);
    next();
  } catch (err) {
    console.log(err);
    next(err)
  }
};
/**
 * Modifies http request body to only contain the specified allowed fields
 * @param {Array} allowedFields - Array of allowed fields
 */
const requestBodyFieldsFilter = (allowedFields) => async(req, res, next)=>{
  try{
    const filteredBody = {}
    allowedFields.forEach((field)=>filteredBody[field]=req.body[field])
    req.body = filteredBody
    next()
  }catch(err){
    console.log(err)
    next(err)
  }
}

export { handleProductImageUpload, requestBodyFieldsFilter };
