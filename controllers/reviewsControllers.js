import pool from "../configs/sqlConnection.js"
import logger from "../utils/logger.js"

const getProductReviews = async(req, res)=>{
    try {
        const query = `SELECT r.ratings, r.comment, u.display_name, u.picture_url
                        FROM reviews AS r JOIN users AS u ON r.user_id = u.user_id
                        WHERE r.product_id = $1`
        const reviews = await pool.query(query, [req.params.id])
        return res.status(200).json(reviews.rows ?? [])
    } catch (err) {
        logger.error("Error getting product reviews", err)
        return res.status(500).json(err)
    }
}

const addReview = async(req, res)=>{
    try {
        const {comment, ratings, productId} = req.body
        const query = `INSERT INTO reviews (user_id, comment, ratings, product_id) VALUES ($1, $2, $3, $4)`
        await pool.query(query, [req.auth.uid, comment, ratings, productId])
        return res.status(201).json({message: "Added successfully"})
    } catch (err) {
        logger.error("Error adding review", err)
        return res.status(500).json(err)
    }
}

const deleteReview = async(req, res)=>{
    try {
        await pool.query("DELETE FROM reviews WHERE review_id = $1", [req.params.id])
        return res.status(200).json({message: "Deleted successfully"})
    } catch (err) {
        logger.error("Error deleting review", err)
        return res.status(500).json(err)
    }
}

export { addReview, deleteReview, getProductReviews }

