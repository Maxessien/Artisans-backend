import { model, Schema } from 'mongoose';
import crypto from "crypto"

const authOtpModel = new Schema({
    otpType: {type: String, enum: ["phone", "email", "phoneNumber"], required: true},
    value: {type: Number, required: true, default: ()=>crypto.randomInt(100000, 1000000), immutable: true},
    reciever: {type: String, required: true},
    expiryTime: {type: Number, required: true, default: Date.now() + (60*1000*5)}
}, {timestamp: true})

export const AuthOtp = model("AuthOtp", authOtpModel)