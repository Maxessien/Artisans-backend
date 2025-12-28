import express from "express";
import {
  addProduct,
  deleteProduct,
  getProducts,
  getVendorProduct,
  updateProduct,
  deleteUploadedProductImage,
  getSingleProduct,
  searchProducts,
} from "../controllers/productControllers.js";
import {
  handleProductImageUpload,
  requestFieldsFilter,
} from "../middlewares/regMiddleware.js";
import {
  userAuthMiddleware,
} from "../middlewares/authMiddleware.js";
import { upload } from "../utils/usersUtilFns.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/single", getSingleProduct);
router.get("/search", searchProducts)
router.get("/vendor", userAuthMiddleware, getVendorProduct);
router.post(
  "/vendor",
  upload.array("images", 5),
  requestFieldsFilter([
    "productName",
    "price",
    "category",
    "vendorId",
    "vendorContact",
    "description",
    "tags",
  ]),
  userAuthMiddleware,
  handleProductImageUpload,
  addProduct
);
router.post(
  "/vendor/:id",
  upload.array("images", 5),
  requestFieldsFilter([
    "productName",
    "price",
    "category",
    "description",
    "tags",
  ]),
  userAuthMiddleware,
  handleProductImageUpload,
  updateProduct
);
router.delete("/:id", userAuthMiddleware, deleteProduct);
router.delete(
  "/image/:id",
  userAuthMiddleware,
  deleteUploadedProductImage
);

export default router;
