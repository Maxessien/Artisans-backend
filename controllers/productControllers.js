import { Product } from "../models/productsModel.js";
import { uploader } from "../configs/cloudinaryConfigs.js";

const getProducts = async (req, res) => {
  try {
    console.log({ ...req.query }, "fffff");
    const { page=1, limit=20, sortBy="createdAt", order="desc", minPrice=0, maxPrice=5000000, category=false } = req.query;
    const products = await Product.find({
      price: { $gte: minPrice, $lte: maxPrice },
      ...(category && category.length > 0 ? {category: {$in: category}} : {})
    })
      .limit(limit)
      .skip((page - 1)*limit)
      .sort([[sortBy, order]])
      .lean();
    const count = await Product.countDocuments();
    console.log(count);
    console.log(products, "prodsss");
    return res
      .status(202)
      .json({ data: products, totalPages: Math.floor(count / 20) });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

const getSingleProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ productId: req.query.id }).lean();
    res.status(200).json(product);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

const getTrendingProducts = async (req, res) => {
  try {
    console.log("stateg", req.headers)
    const trendingProducts = await Product.find()
      .sort([["ratings", "desc"]])
      .limit(6)
      .lean();
    return res.status(202).json(trendingProducts);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

const getVendorProduct = async (req, res) => {
  try {
    const vendorProducts = await Product.find({
      vendorId: req.auth.uid,
    }).lean();
    return res.status(200).json(vendorProducts);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

const addProduct = async (req, res) => {
  try {
    const { email, phone } = req.auth.isVerified;
    if (!email || !phone) throw new Error("Unverified vendor");
    await Product.create({
	name: req.body.productName,
	...req.body,
      images: req.images,
      vendorId: req.auth?.uid,
      vendorContact: { email: req.auth.email },
    });
    return res.status(201).json({ message: "Product added successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({productId: req.params.id}).select("images").lean()
	console.log(product, "proooooo")
    await Product.updateOne({productId: req.params.id}, {
	...req.body,
	name: req.body.productName,
	images: req?.images ? [...product.images, ...req.images] : product.images
	})
    return res.status(200).json({ message: "Updated successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { images } = await Product.findOne({ productId: req.query.productId })
      .select("images")
      .lean();
    await Promise.all(images.map(({ publicId }) => uploader.destroy(publicId)));
    await Product.deleteOne({ productId: req.query.productId });
    return res.status(200).json({ message: "Deleted Successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

const deleteUploadedProductImage = async (req, res) => {
  try {
    const product = await Product.findOne({
      productId: req.query.productId,
    }).lean();
    await Product.updateOne(
      { productId: req.query.productId },
      {
        images: product.images.filter(
          ({ publicId }) => publicId !== req.query.publicId
        ),
      }
    );
    await uploader.destroy(req.query.publicId);
    return res.status(200).json({message: "Updated successfully"});
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

export {
  getProducts,
  getSingleProduct,
  getTrendingProducts,
  getVendorProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  deleteUploadedProductImage,
};
