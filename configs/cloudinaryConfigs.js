import {v2 as cloudinary} from 'cloudinary';
// import offlineCloudinary from "./offlineCloudinary.js"
import { cloudinaryEmulator } from 'cloudinary-emulator';

cloudinary.config({
    secure: true
})

export const uploader =process.env.NODE_ENV === "development" ? cloudinaryEmulator : cloudinary.uploader