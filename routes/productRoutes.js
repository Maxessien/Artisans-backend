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
} from "../controllers/productControllers.js";
import { handleProductImageUpload } from "../middlewares/fileUploadMiddleware.js";
import { verifyVendorOwnership, userAuthMiddleware } from "../middlewares/authMiddleware.js";
import { upload } from "../utils/usersUtilFns.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/single", getSingleProduct);
router.get("/trending", getTrendingProducts);
router.get("/vendor", userAuthMiddleware, getVendorProduct);
router.post("/vendor", upload.array("images", 5), userAuthMiddleware, handleProductImageUpload, addProduct);
router.post(
  "/vendor/:id",
  userAuthMiddleware,
  verifyVendorOwnership,
  upload.array("images", 5),
  handleProductImageUpload,
  updateProduct
);
router.delete("/:id", userAuthMiddleware, verifyVendorOwnership, deleteProduct);
router.delete(
  "/:id/image",
  userAuthMiddleware,
  verifyVendorOwnership,
  deleteUploadedProductImage
);

export default router;
  