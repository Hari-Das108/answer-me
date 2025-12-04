import express from "express";
import apiKeyController from "../controllers/apiKeyController.js";
import authController from "../controllers/authController.js";
import cors from "cors";

const router = express.Router();

router
  .route("/generate-key")
  .get(
    cors({ exposedHeaders: ["Retry-After"] }),
    authController.protect,
    apiKeyController.generateKey
  );

export default router;
