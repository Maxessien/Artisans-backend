import { model, Schema } from "mongoose";
import crypto from "crypto";

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    images: {
      type: [
        {
          url: { type: String, required: true },
          publicId: { type: String, required: true },
        },
      ],
      required: true,
    },
    productId: {
      type: String,
      required: true,
      default: () => crypto.randomUUID(),
    },
    category: { type: String, required: true, default: [] },
    productReviews: { type: Array, required: true, default: [] },
    vendorId: { type: String, required: true },
    vendorContact: {
      email: { type: String, required: true },
      phoneNumber: { type: String },
    },
    productStatus: {type: String, required: true, enum: ["active", "inactive"], default: "active"},
    description: { type: String },
    tags: { type: [String], required: true, default: [] },
    ratings: { type: Number, required: true, min: 1, max: 5, default: 3 },
    comments: { type: [String], required: true, default: [] },
    vectorRepresentation: { type: [Number], required: true, default: [] },
  },
  { timestamps: true }
);

export const Product = model("Product", productSchema);
