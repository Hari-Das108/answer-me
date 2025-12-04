import express from "express";
import queryController from "../controllers/queryController.js";

import authController from "../controllers/authController.js";
import verifyApiKey from "../middlewares/verifyApiKey.js";

import { queryLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router
  .route("/query")
  .post(
    authController.protect,
    verifyApiKey,
    queryLimiter,
    queryController.validateQueries,
    queryController.getContexts,
    queryController.getLLMResponses,
    queryController.getAnswers
  );

export default router;
