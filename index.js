import emailjs from "@emailjs/nodejs";
import { startEmulator } from 'cloudinary-emulator';
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { rateLimit } from "express-rate-limit";
import { app, server } from "./configs/serverConfig.js";
import pool from "./configs/sqlConnection.js";
import authRoutes from "./routes/authRoutes.js";
import categoriesRoutes from "./routes/categoriesRoutes.js";
import notificationsRoutes from "./routes/notificationsRoutes.js";
import ordersRoutes from "./routes/ordersRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import reviewsRoutes from "./routes/reviewsRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import {
  createAuthOtpTable,
  createCartsTable,
  createCategoriesTable,
  createNotificationsTable,
  createOrdersTable,
  createProductImagesTable,
  createProductsTable,
  createReviewsTable,
  createUserTable,
} from "./utils/createTables.js";
import logger from "./utils/logger.js";

dotenv.config();

console.log(process.env.CORS_ORIGIN);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(
  rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 100,
    standardHeaders: true,
  })
);

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
app.use("/reviews", reviewsRoutes);
app.use("/notifications", notificationsRoutes);



(async () => {
  try {
    // Basic connectivity check
    await pool.query("SELECT 1");

    // Create tables in correct order (respecting dependencies)
    await createUserTable();
    await createCategoriesTable();
    await createProductsTable();
    await createProductImagesTable();
    await createOrdersTable();
    await createReviewsTable();
    await createCartsTable();
    await createNotificationsTable();
    await createAuthOtpTable();
  } catch (err) {
    logger.error("Database initialization error", err);
    process.exit(1);
  }
})();

process.env.NODE_ENV === "development" ? startEmulator(4000) : null

const PORT = process.env.PORT || 5050;

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});
