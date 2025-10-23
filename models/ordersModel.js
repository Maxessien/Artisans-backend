import { model, Schema } from "mongoose";
import crypto from "crypto";

const orderSchema = new Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      default: () => crypto.randomUUID(),
    },
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    variant: {type: String},
    vendorId: { type: String, required: true },
    quantityOrdered: { type: Number, required: true, default: 1 },
    deliveryStatus: {
      type: String,
      enum: ["pending", "delivered", "active", "cancelled"],
      required: true,
      default: "pending"
    },
    userId: { type: String, required: true },
    address: { type: String, required: true },
    customerContactInfo: {
      name: {type: String, required: true},
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
  },
  { timeStamp: true }
);

export const Order = model("Order", orderSchema);
