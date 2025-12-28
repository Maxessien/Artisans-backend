import pool from "../configs/sqlConnection.js";
import logger from "../utils/logger.js";

const getCategories = async(req, res)=>{
    try {
        const query = "SELECT * FROM categories"
        const categories = await pool.query(query)
        logger.log("getCategories result", categories);
        return res.status(200).json(categories.rows)
    } catch (err) {
        logger.error("getCategories error", err);
        return res.status(500).json(err)
    }
}

const addCategory = async(req, res)=>{
    try {
        const query = "INSERT INTO categories VALUES ($1, $2)"
        await pool.query(query, [req.body.title, req.body.imageUrl])
        return res.status(201).json({message: "Category added successfully"})
    } catch (err) {
        logger.error("addCategory error", err);
        return res.status(500).json(err)
    }
}

const deleteCategory = async(req, res)=>{
    try {
        await pool.query("DELETE FROM categories WHERE title = $1", [req.params.title])
        return res.status(200).json({message: "Category deleted successfully"})
    } catch (err) {
        logger.error("deleteCategory error", err);
        return res.status(500).json(err)
    }
}

export { addCategory, deleteCategory, getCategories };

