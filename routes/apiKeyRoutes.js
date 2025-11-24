import express from "express";
import apiKeyController from "../controllers/apiKeyController.js";
import { apiKeyLimiter } from "../middlewares/rateLimiter.js";
import cors from "cors";

const router = express.Router();

router
  .route("/generate-key")
  .get(
    cors({ exposedHeaders: ["Retry-After"] }),
    apiKeyLimiter,
    apiKeyController.generateKey
  );

export default router;
