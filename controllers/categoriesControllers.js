import { Category } from "../models/categoriesModel.js"

const getCategories = async(req, res)=>{
    try {
        const query = "SELECT * FROM categories"
        const categories = await pool.query(query)
        console.log(categories)
        res.status(202).json(categories.rows)
    } catch (err) {
        console.log(err)
        res.status(500).json(err)
    }
}

const addCategory = async(req, res)=>{
    try {
        const query = "INSERT INTO categories VALUES ($1, $2)"
        await pool.query(query, [req.body.title, req.body.imageUrl])
        return res.status(201).json({message: "Categroy added successfully"})
    } catch (err) {
        console.log(err)
        res.status(500).json(err)
    }
}

const deleteCategory = async(req, res)=>{
    try {
        await pool.query("DELETE FROM categories WHERE title = $1", [req.params.title])
        return res.status(201).json({message: "Categroy deleted successfully"})
    } catch (err) {
        console.log(err)
        res.status(500).json(err)
    }
}

export {getCategories, addCategory, deleteCategory}