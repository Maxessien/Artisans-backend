import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoriesRoutes from "./routes/categoriesRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import ordersRoutes from "./routes/ordersRoutes.js";
import dotenv from "dotenv";
import { connectDB } from "./configs/mongoDBConfig.js";
import { Product } from "./models/productsModel.js";
import { test } from "./test.js";
import { auth } from "./configs/fbConfigs.js";
import emailjs from "@emailjs/nodejs"
import { Category } from "./models/categoriesModel.js";
import { User } from "./models/usersModel.js";

dotenv.config();

const app = express();

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

const PORT = process.env.PORT || 5050;

connectDB();

try {
  const categories = ["Academics", "Food", "Clothing", "Snacks", "Drinks"]
  const formatted = categories.map((title)=>({name: title}))
  const stored = await Category.insertMany(formatted)
  console.log(stored)
  const count = await Product.find()
  console.log("Product count", count)
    const user = await auth.createUser({
  displayName: "Max Essien",
  email: "essienmax484@gmail.com",
  phoneNumber: "+2348114537444",
	password: "max12354"
});
    await auth.setCustomUserClaims(user.uid, {
      role: "user",
      isVerified: { email: true, phone: true },
    });
  //const user = await auth.getUserByEmail("essienmax484@gmail.com")
  if (user) console.log(user.uid)
	await User.updateOne({email: user.email}, {userId: user.uid})
} catch (err) {
  console.log(err);
}

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
