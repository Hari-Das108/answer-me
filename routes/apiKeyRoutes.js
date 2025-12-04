import express from "express";
import apiKeyController from "../controllers/apiKeyController.js";
import authController from "../controllers/authController.js";
import { apiKeyLimiter } from "../middlewares/rateLimiter.js";
import cors from "cors";

const router = express.Router();

router
  .route("/generate-key")
  .get(
    authController.protect,
    cors({ exposedHeaders: ["Retry-After"] }),
    apiKeyLimiter,
    apiKeyController.generateKey
  );

export default router;
