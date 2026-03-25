import express from "express";
import testController from "../controllers/testController.js";

const router = express.Router();

router.route("/match").post(testController.categorizeStrings);

export default router;
