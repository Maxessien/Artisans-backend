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
 * @param {String} objectToFilter - Request Object to be filtered
 */
const requestFieldsFilter = (allowedFields, objectToFilter = "body") => (req, res, next)=>{
    const filterableObjects = ["query", "params", "body"]
  try{
    if (!filterableObjects.includes(objectToFilter)) {
        throw new Error(`${objectToFilter} object cannot be filtered`)
    }
    const filteredBody = {}
    allowedFields.forEach((field)=>filteredBody[field]=req[objectToFilter][field])
    req[objectToFilter] = filteredBody
    next()
  }catch(err){
    console.log(err)
    next(err)
  }
}

export { handleProductImageUpload, requestFieldsFilter };
