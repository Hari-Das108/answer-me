import jwt from "../utils/jwtUtils.js";
import AppError from "../utils/appError.js";

export default (req, res, next) => {
  try {
    const token = req.headers["x-api-key"];
    if (!token) {
      return next(new AppError("API key is missing", 400));
    }

    const decoded = jwt.verifyKey(token);
    if (!decoded || !decoded.key) {
      return next(new AppError("Invalid or expired API key", 401));
    }

    req.apiKey = decoded.key;
    req.userId = decoded.userId;
    next();
  } catch {
    return next(new AppError("Invalid or expired API key", 401));
  }
};
