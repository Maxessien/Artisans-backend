import { auth } from "../configs/fbConfigs.js";
import { Product } from "../models/productsModel.js";

const userAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.Authorization || req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader?.split("Bearer ")[1] || ""
    : null;
  try {
    if (!token) throw new Error("Unauthorised access one");
    const decodedToken = await auth.verifyIdToken(token);
    if ("user" !== decodedToken.role || !decodedToken) {
      throw new Error("Unauthorised access two");
    } else {
      req.auth = decodedToken;
      console.log(decodedToken, "token token");
      return next();
    }
  } catch (err) {
    console.log(err, "error");
    next(err);
  }
};

const verifyAdmin = async (req, res, next) => {
  try {
    if (!req?.auth) throw new Error("User not logged in");
    const isAdmin = req.auth.role === "admin";
    if (isAdmin) {
      return next();
    } else {
      throw new Error("Not an Admin");
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export {
  userAuthMiddleware,
  verifyAdmin,
};
