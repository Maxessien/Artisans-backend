import { Schema } from "mongoose";
import crypto from "crypto"

const productReviewSchema = new Schema({
    reviewsId: {type: String, required: true, unique: true, default: ()=>crypto.randomUUID()},
    userInfo: {type: {name: String, userId: String}, required: true},
    productId: {type: String, required: true},
    ratings: {type: Number, required: true, default: 3},
    textFeedback: {type: String, required: true},
}, {timeStamp: true})

export const ProductReview = model("Reviews", productReviewSchema)