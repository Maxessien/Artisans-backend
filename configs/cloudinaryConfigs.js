import {v2 as cloudinary} from 'cloudinary';
import offlineCloudinary from "./offlineCloudinary.js"

cloudinary.config({
    secure: true
})

export const uploader =process.env.NODE_ENV === "development" ? offlineCloudinary : cloudinary.uploader