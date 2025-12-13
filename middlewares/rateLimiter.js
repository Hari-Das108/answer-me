import rateLimit from "express-rate-limit";
import AppError from "../utils/appError.js";

export const uploadLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 5,
  skipFailedRequests: true,
  keyGenerator: (req, res) => {
    return req.user;
  },
  handler: (req, res, options) => {
    throw new AppError("You can insert only 5 times in 24 hours", 429);
  },
});

export const queryLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 10,
  skipFailedRequests: true,
  keyGenerator: (req, res) => {
    return req.user;
  },
  handler: (req, res, options) => {
    throw new AppError("You can query only 10 times in 24 hours", 429);
  },
});
