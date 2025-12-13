import express from "express";
import authController from "../controllers/authController.js";

const router = express.Router();

router.get("/me", authController.protect, authController.getMe);
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);

export default router;
