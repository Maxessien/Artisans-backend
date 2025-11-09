import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoriesRoutes from "./routes/categoriesRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import ordersRoutes from "./routes/ordersRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import dotenv from "dotenv";
import { connectDB } from "./configs/mongoDBConfig.js";
import emailjs from "@emailjs/nodejs";
import { app, server } from "./configs/serverConfig.js";
import {rateLimit} from "express-rate-limit"
import ExpressMongoSanitize from "express-mongo-sanitize";

dotenv.config();

console.log(process.env.CORS_ORIGIN)

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"], 
    credentials: true,
  })
);

app.use(rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 100,
  standardHeaders: true
}))

app.use(ExpressMongoSanitize({replaceWith: "_"}))

emailjs.init({
  publicKey: process.env.EMAILJS_PUBLIC_KEY,
  privateKey: process.env.EMAILJS_PRIVATE_KEY,
});

app.use(express.json());


//express routes
app.use("/user", userRoutes);
app.use("/product", productRoutes);
app.use("/category", categoriesRoutes);
app.use("/auth", authRoutes);
app.use("/orders", ordersRoutes);
app.use("/chat", chatRoutes);

const PORT = process.env.PORT || 5050;

connectDB();

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});