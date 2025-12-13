import AppError from "../utils/appError.js";
import ApiKey from "../models/apiKeyModel.js";

export default async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) {
      return next(new AppError("API key is missing", 400));
    }

    // 1. Find the API key in DB
    const apiKeyDoc = await ApiKey.findOne({ apiKey }).populate("userId");
    if (!apiKeyDoc) {
      return next(new AppError("Invalid API key", 401));
    }

    if (!String(apiKeyDoc.userId._id)) {
      return next(new AppError("API key not linked to a valid user", 401));
    }

    if (String(apiKeyDoc.userId._id) !== String(req.user._id)) {
      return next(new AppError("Invalid API key", 401));
    }

    // // safest way
    // if (!apiKeyDoc.userId._id.equals(req.user._id)) {
    //   return next(new AppError("Invalid API key", 401));
    // }

    // const expiryHours = 24;
    // const expiryDate = new Date(apiKeyDoc.createdAt.getTime() + expiryHours * 60 * 60 * 1000);
    // if (Date.now() > expiryDate) {
    //   return next(new AppError("API key has expired", 401));
    // }

    req.iat = Math.floor(apiKeyDoc.createdAt.getTime() / 1000);

    next();
  } catch {
    return next(new AppError("Invalid or expired API key", 401));
  }
};
