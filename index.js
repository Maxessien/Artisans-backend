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
import { test } from "./test.js";
import emailjs from "@emailjs/nodejs"
import { createServer } from "http"
import { Server } from "socket.io";
// import { createServer } from "https";

dotenv.config();

const app = express();
const server = createServer(app)
export const io = new Server(server)

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

emailjs.init({
  publicKey: process.env.EMAILJS_PUBLIC_KEY,
  privateKey: process.env.EMAILJS_PRIVATE_KEY
});

app.use(express.json());

const newTest = test.products;

//express routes
app.use("/user", userRoutes);
app.use("/product", productRoutes);
app.use("/category", categoriesRoutes);
app.use("/auth", authRoutes)
app.use("/orders", ordersRoutes)
app.use("/chat", chatRoutes)

const PORT = process.env.PORT || 5050;

connectDB();

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
