import express from "express";
import apiKeyController from "../controllers/apiKeyController.js";
import { apiKeyLimiter } from "../middlewares/rateLimiter.js";
import { unique } from "../middlewares/unique.js";
import cors from "cors";

const router = express.Router();

router
  .route("/generate-key")
  .get(
    cors({ exposedHeaders: ["Retry-After"] }),
    unique,
    apiKeyLimiter,
    apiKeyController.generateKey
  );

export default router;
