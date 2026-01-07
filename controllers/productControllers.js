import axios from "axios";
import { uploader } from "../configs/cloudinaryConfigs.js";
import pool from "../configs/sqlConnection.js";
import logger from "../utils/logger.js";
import { addedProductEmail, genParamsFromArray } from "../utils/usersUtilFns.js";

const getProducts = async (req, res) => {
  try {
    logger.log("getProducts query", { ...req.query });
    const {
      page = 1,
      limit = 20,
      sortBy = "date_added",
      order = "desc",
      minPrice = 0,
      maxPrice = 5000000,
      category = [],
    } = req.query;
    const selectedCategories =
      category?.length > 0
        ? category
        : (
            await pool.query(
              "SELECT COALESCE(json_agg(title), '[]') AS title FROM categories"
            )
          )?.rows[0]?.title || [];
    const orderByCol = ["date_added", "ratings", "price"].includes(sortBy) && sortBy !== "date_added"
                            ? (sortBy === "ratings" ? "ratings" : "p.price")
                            : "p.date_added"
                        
    const formattedParams = genParamsFromArray(5, selectedCategories)
    const fetchQuery = `SELECT p.product_id, p.product_name, p.price, p.description,
                        AVG(r.ratings) AS ratings, (SELECT COUNT(*) FROM products) as total_products,
                        json_agg(img.image_url) AS images
                        FROM products AS p
                        LEFT JOIN reviews AS r ON p.product_id = r.product_id
                        LEFT JOIN product_images AS img ON p.product_id = img.product_id
                        WHERE (p.price BETWEEN $1 AND $2) AND p.category IN ${formattedParams}
                        GROUP BY p.product_id, p.product_name, p.price, p.description
                        ORDER BY ${orderByCol} ${order === "desc" ? "DESC" : "ASC"}
                        LIMIT $3 OFFSET $4`;
    const products = await pool.query(fetchQuery, [
      Number(minPrice),
      Number(maxPrice),
      Number(limit),
      Number(limit) * (Number(page) - 1),
      ...selectedCategories
    ]);
    logger.log("getProducts result", products);
    return res.status(200).json({
      data: products.rows || [],
      totalPages: Math.ceil(Number(products.rows[0]?.total_products) / Number(limit)) || 0,
    });
  } catch (err) {
    logger.error("getProducts error", err);
    return res.status(500).json(err);
  }
};

const getSingleProduct = async (req, res) => {
  try {
    const query =
      `SELECT p.product_id, p.product_name, p.price, p.category, p.vendor_id, p.description, u.display_name AS vendor_name 
        FROM products AS p
        JOIN users AS u ON u.user_id = p.vendor_id
        WHERE product_id = $1`;
    const product = await pool.query(query, [req.query.id]);
    return res.status(200).json(product.rows[0]);
  } catch (err) {
    logger.error("getSingleProduct error", err);
    return res.status(500).json(err);
  }
};

const getVendorProduct = async (req, res) => {
  try {
    const query =
      "SELECT product_id, product_name, price, category, vendor_id, description FROM products WHERE vendor_id = $1";
    const vendorProducts = await pool.query(query, [req.auth.uid]);
    return res.status(200).json(vendorProducts.rows);
  } catch (err) {
    logger.error("getVendorProduct error", err);
    return res.status(500).json(err);
  }
};

const addProduct = async (req, res) => {
  try {
    const { email, phone } = req.auth.isVerified;
    if (!email || !phone) throw new Error("Unverified vendor");
    const { productName, description, category, price } = req.body;
    const { data } = await axios.post(
      `${process.env.PYTHON_BACKEND_URL}/api/embeddings`,
      { text: `${productName} ${description} ${category}` }
    );
    const query =
      "INSERT INTO products (product_name, price, category, description, vendor_id, vector_rep) VALUES ($1, $2, $3, $4, $5, $6)";
    await pool.query(query, [
      productName,
      price,
      category,
      description,
      req.auth.uid,
      data.embedding,
    ]);
    await addedProductEmail(productName, category, price);
    return res.status(201).json({ message: "Product added successfully" });
  } catch (err) {
    logger.error("addProduct error", err);
    return res.status(500).json(err);
  }
};

const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // insert any newly uploaded images (req.images expected to be array of { publicId, url })
    if (req.images && Array.isArray(req.images) && req.images.length > 0) {
      const insertPromises = req.images.map((img) => {
        const publicId = img.publicId || img.publicid || img.public_id;
        const url = img.url || img.imageUrl || img.imageURL;
        return pool.query(
          "INSERT INTO product_images (image_public_id, product_id, image_url) VALUES ($1, $2, $3) ON CONFLICT (image_public_id) DO NOTHING",
          [publicId, productId, url]
        );
      });
      await Promise.all(insertPromises);
    }

    // update product fields
    const { productName, price, category, description } = req.body;
    await pool.query(
      "UPDATE products SET product_name = $1, price = $2, category = $3, description = $4 WHERE product_id = $5",
      [productName, price, category, description, productId]
    );

    return res.status(200).json({ message: "Updated successfully" });
  } catch (err) {
    logger.error("updateProduct error", err);
    return res.status(500).json(err);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const productId = req.query.productId;
    // fetch image public ids
    const imagesRes = await pool.query(
      "SELECT image_public_id FROM product_images WHERE product_id = $1",
      [productId]
    );
    const images = imagesRes.rows || [];

    // destroy cloudinary images
    await Promise.all(
      images.map((r) =>
        uploader.destroy(r.image_public_id || r.imagepublicid || r.publicid)
      )
    );

    // delete product (product_images rows cascade)
    await pool.query("DELETE FROM products WHERE product_id = $1", [productId]);
    return res.status(200).json({ message: "Deleted Successfully" });
  } catch (err) {
    logger.error("deleteProduct error", err);
    return res.status(500).json(err);
  }
};

const deleteUploadedProductImage = async (req, res) => {
  try {
    const { productId, publicId } = req.query;
    // delete image row from product_images
    await pool.query(
      "DELETE FROM product_images WHERE image_public_id = $1 AND product_id = $2",
      [publicId, productId]
    );
    // destroy cloudinary image
    await uploader.destroy(publicId);
    return res.status(200).json({ message: "Updated successfully" });
  } catch (err) {
    logger.error("deleteUploadedProductImage error", err);
    return res.status(500).json(err);
  }
};

const searchProducts = async (req, res) => {
  try {
    const {
      searchTerm,
      page = 1,
      limit = 20,
      sortBy = "date_added",
      order = "desc",
      minPrice = 10,
      maxPrice = 5000000,
    } = req.query;
    logger.log("searchProducts query", { ...req.query });
    if (!searchTerm || typeof searchTerm !== "string")
      throw new Error("Invalid search term");
    const { data } = await axios.post(
      `${process.env.PYTHON_BACKEND_URL}/api/embeddings`,
      { text: searchTerm }
    );
    const query = `SELECT product_id, product_name, price, category, vendor_id, description, embedding <#> $1 AS score
                    FROM products WHERE price BETWEEN $2 AND $3
                    ORDER BY embedding <#> $1, ${
                      ["date_added", "price"].includes(sortBy)
                        ? sortBy
                        : "date_added"
                    } ${order === "desc" ? "DESC" : "ASC"}
                    LIMIT $4
                    OFFSET $5`;
    const searchResult = await pool.query(query, [
      data.embedding,
      minPrice,
      maxPrice,
      limit,
      limit * (page - 1),
    ]);
    logger.log("searchProducts result", searchResult);
    return res.status(200).json({ data: searchResult.rows, totalPages: 1 });
  } catch (err) {
    logger.error("searchProducts error", err);
    return res.status(500).json(err);
  }
};

export {
  addProduct,
  deleteProduct,
  deleteUploadedProductImage,
  getProducts,
  getSingleProduct,
  getVendorProduct,
  searchProducts,
  updateProduct
};

