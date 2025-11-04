# 🛒 LASU Mart Backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)

---

## 🧩 Overview

**LASU Mart Backend** powers the [LASU Mart Frontend](https://github.com/Maxessien/Lasu-Mart-frontend) — a modern e-commerce platform built for the **Lagos State University community**.  
It handles **user authentication**, **product management**, **order processing**, **category organization**, and **image uploads** — ensuring a smooth and scalable shopping experience for students and sellers alike.

This backend is built with **Node.js**, **Express**, and **MongoDB**, integrated with **Firebase** and **Cloudinary** for authentication and media handling.

---

## ⚙️ Tech Stack

| Category | Technologies Used |
|-----------|-------------------|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Authentication** | Firebase Auth, OTP-based login |
| **File Storage** | Cloudinary (with offline fallback) |
| **Middleware** | Custom authentication & file upload |
| **Utilities** | Custom math and user utilities |
| **Environment Config** | dotenv |

---

## 🧠 Project Architecture

configs/ ├── cloudinaryConfigs.js ├── fbConfigs.js ├── mongoDBConfig.js ├── offlineCloudinary.js └── serviceAccount.js controllers/ ├── categoriesControllers.js ├── ordersControllers.js ├── productControllers.js ├── userAuthControllers.js └── userDataControllers.js middlewares/ ├── authMiddleware.js └── fileUploadMiddleware.js models/ ├── authOtpModel.js ├── categoriesModel.js ├── ordersModel.js ├── productReviewsModel.js ├── productsModel.js └── usersModel.js routes/ ├── categoriesRoutes.js ├── productRoutes.js └── userRoutes.js utils/ ├── mathUtils.js └── usersUtilFns.js index.js

---

## 🚀 Key Features

- 🔐 **Secure OTP-based Authentication** using Firebase  
- 🧾 **Order & Product Management** with controllers for clean separation of logic  
- ☁️ **Cloud Image Uploads** via Cloudinary with local fallback when offline  
- 🧠 **Optimized Database Models** using Mongoose schemas  
- 🔄 **Middleware Architecture** for authentication and file uploads  
- 🧰 **Reusable Utility Functions** for cleaner, modular code  
- 🌍 **Offline Support** for smoother user experience when the network is unstable  

---

## 🧪 API Testing

- Test endpoints easily using **Postman** or **Thunder Client**
- All routes are prefixed (e.g., `/api/users`, `/api/products`, `/api/orders`)

Example request:
```bash
POST /api/users/login
Content-Type: application/json
{
  "phone": "+2348012345678",
    "otp": "123456"
    }


    ---

    🛠️ Setup Instructions

    1. Clone this repository:

    git clone https://github.com/Maxessien/Lasu-Mart-backend.git


    2. Navigate into the project directory:

    cd Lasu-Mart-backend


    3. Install dependencies:

    npm install


    4. Create a .env file and add your environment variables:

    MONGODB_URI=your_mongodb_connection
    FIREBASE_SERVICE_ACCOUNT=your_service_account_path
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret


    5. Start the development server:

    npm run dev




    ---

    🧑🏽‍💻 About the Developer

    👋🏽 Built by Max Essien
    A passionate full-stack developer and student of Computer Science at LASU, focused on creating digital tools that simplify life on campus.
    Max blends creativity, logic, and precision to deliver production-grade projects even at prototype level.

    > “LASU Mart isn’t just an app — it’s a community project built for LASUITES by a LASUITE.”




    ---

    🌟 Contributing

    Contributions are welcome!
    If you’d like to improve the project, feel free to fork the repo and open a pull request.


    ---

    🪪 License

    This project is licensed under the MIT License — feel free to use and modify it.


    ---

    ⭐ Don’t forget to star the repo if you find it helpful!

    