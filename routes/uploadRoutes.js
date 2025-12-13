import express from "express";
import uploadController from "../controllers/uploadController.js";
import authController from "../controllers/authController.js";
import verifyApiKey from "../middlewares/verifyApiKey.js";
import { uploadLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router
  .route("/upload")
  .post(
    verifyApiKey,
    uploadLimiter,
    uploadController.verifyDatabase,
    uploadController.uploadTextFile,
    uploadController.validateInsert,
    uploadController.chunkTexts,
    uploadController.insertText
  );

export default router;
