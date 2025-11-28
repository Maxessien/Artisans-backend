import express from "express";
import {
  addProduct,
  deleteProduct,
  getProducts,
  getTrendingProducts,
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
  verifyVendorOwnership,
  userAuthMiddleware,
} from "../middlewares/authMiddleware.js";
import { upload } from "../utils/usersUtilFns.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/single", getSingleProduct);
router.get("/trending", getTrendingProducts);
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
  verifyVendorOwnership,
  handleProductImageUpload,
  updateProduct
);
router.delete("/:id", userAuthMiddleware, verifyVendorOwnership, deleteProduct);
router.delete(
  "/image/:id",
  userAuthMiddleware,
  verifyVendorOwnership,
  deleteUploadedProductImage
);

export default router;
