import AppError from "../utils/appError.js";
import ApiKey from "../models/apiKeyModel.js";

export default async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) {
      return next(new AppError("API key is missing", 400));
    }

    const apiKeyDoc = await ApiKey.findOne({ apiKey }).populate("userId");
    if (!apiKeyDoc) {
      return next(new AppError("Invalid API key", 401));
    }

    if (!apiKeyDoc.userId) {
      return next(new AppError("API key not linked to a valid user", 401));
    }

    req.user = String(apiKeyDoc.userId._id);
    req.iat = Math.floor(apiKeyDoc.createdAt.getTime() / 1000);

    next();
  } catch {
    return next(new AppError("Invalid or expired API key", 401));
  }
};
