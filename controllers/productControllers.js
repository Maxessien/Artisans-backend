import axios from "axios";
import { uploader } from "../configs/cloudinaryConfigs.js";
import pool from "../configs/sqlConnection.js";
import { addedProductEmail } from "../utils/usersUtilFns.js";

const getProducts = async (req, res) => {
  try {
    console.log({ ...req.query }, "fffff");
    const {
      page = 1,
      limit = 20,
      sortBy = "dateAdded",
      order = "desc",
      minPrice = 0,
      maxPrice = 5000000,
      category = "",
    } = req.query;
    const selectedCategories =
      category?.length > 0
        ? category
        : (
            await pool.query(
              "SELECT COALESCE(json_agg(title), '[]') AS title FROM categories"
            )
          ).rows[0].title;
    const fetchQuery = `SELECT productId, productName, price, category, vendorId, description, COUNT(*) AS totalProducts
                        FROM products 
                        WHERE (price BETWEEN $1 AND $2) AND category IN $3
                        ORDER BY ${
                          ["dateAdded", "price"].includes(sortBy)
                            ? sortBy
                            : "dateAdded"
                        } ${order === "desc" ? "DESC" : "ASC"}
                        LIMIT $4 OFFSET $5`;
    const products = await pool.query(fetchQuery, [
      minPrice,
      maxPrice,
      `(${selectedCategories.join(",")})`,
      limit,
      limit * (page - 1),
    ]);
    console.log(products, "prodsss");
    return res.status(202).json({
      data: products.rows || [],
      totalPages: Math.floor(products.rows[0]?.totalProducts / limit) || 0,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

const getSingleProduct = async (req, res) => {
  try {
    const query =
      "SELECT productId, productName, price, category, vendorId, description FROM products WHERE productId = $1";
    const product = await pool.query(query, [req.query.id]);
    res.status(200).json(product.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

const getVendorProduct = async (req, res) => {
  try {
    const query =
      "SELECT productId, productName, price, category, vendorId, description FROM products WHERE vendorId = $1";
    const vendorProducts = await pool.query(query, [req.auth.uid]);
    return res.status(200).json(vendorProducts.rows);
  } catch (err) {
    console.log(err);
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
      "INSERT INTO products (productName, price, category, description, vendorId, vectorRep) VALUES ($1, $2, $3, $4, $5, $6)";
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
    console.log(err);
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
          "INSERT INTO productimages (imagePublicId, productid, imageurl) VALUES ($1, $2, $3) ON CONFLICT (imagePublicId) DO NOTHING",
          [publicId, productId, url]
        );
      });
      await Promise.all(insertPromises);
    }

    // update product fields
    const { productName, price, category, description } = req.body;
    await pool.query(
      "UPDATE products SET productname = $1, price = $2, category = $3, description = $4 WHERE productid = $5",
      [productName, price, category, description, productId]
    );

    return res.status(200).json({ message: "Updated successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

const deleteProduct = async (req, res) => {
  try {
    const productId = req.query.productId;
    // fetch image public ids
    const imagesRes = await pool.query(
      "SELECT imagePublicId FROM productimages WHERE productid = $1",
      [productId]
    );
    const images = imagesRes.rows || [];

    // destroy cloudinary images
    await Promise.all(
      images.map((r) =>
        uploader.destroy(r.imagePublicId || r.imagepublicid || r.publicid)
      )
    );

    // delete product (productimages rows cascade)
    await pool.query("DELETE FROM products WHERE productid = $1", [productId]);
    return res.status(200).json({ message: "Deleted Successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

const deleteUploadedProductImage = async (req, res) => {
  try {
    const { productId, publicId } = req.query;
    // delete image row from productImages
    await pool.query(
      "DELETE FROM productimages WHERE imagePublicId = $1 AND productid = $2",
      [publicId, productId]
    );
    // destroy cloudinary image
    await uploader.destroy(publicId);
    return res.status(200).json({ message: "Updated successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json(err);
  }
};

const searchProducts = async (req, res) => {
  try {
    const {
      searchTerm,
      page = 1,
      limit = 20,
      sortBy = "dateAdded",
      order = "desc",
      minPrice = 10,
      maxPrice = 5000000,
    } = req.query;
    console.log({ ...req.query });
    if (!searchTerm || typeof searchTerm !== "string")
      throw new Error("Invalid search term");
    const { data } = await axios.post(
      `${process.env.PYTHON_BACKEND_URL}/api/embeddings`,
      { text: searchTerm }
    );
    const query = `SELECT productId, productName, price, category, vendorId, description, embedding <#> $1 AS score
                    FROM products WHERE price BETWEEN $2 AND $3
                    ORDER BY embedding <#> $1, ${
                      ["dateAdded", "price"].includes(sortBy)
                        ? sortBy
                        : "dateAdded"
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
    console.log(searchResult, "results");
    return res.status(200).json({ data: searchResult.rows, totalPages: 1 });
  } catch (err) {
    console.log(err);
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
  updateProduct,
};
