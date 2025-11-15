import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import AppError from "../utils/appError.js";

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1,
  skipFailedRequests: true,
  keyGenerator: (req, res) => {
    return req.headers["x-api-key"] || ipKeyGenerator(req);
  },
  handler: (req, res, options) => {
    throw new AppError("You can only insert one File", 429);
  },
});

export const queryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req, res) => {
    return req.headers["x-api-key"] || ipKeyGenerator(req);
  },
  handler: (req, res, options) => {
    throw new AppError("Too many Queries!!!", 429);
  },
});

export const apiKeyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1,
  skipFailedRequests: true,
  handler: (req, res, options) => {
    throw new AppError("Generate Key after 15 minutes", 429);
  },
});
