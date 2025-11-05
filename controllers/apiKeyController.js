import crypto from "crypto";
import jwt from "../utils/jwtUtils.js";
import AppError from "../utils/appError.js";
import { v4 as uuidv4 } from "uuid";

const generateKey = (req, res, next) => {
  try {
    const rawKey = crypto.randomBytes(8).toString("hex");
    const token = jwt.signKey(rawKey, uuidv4());

    res.json({ status: "success", apiKey: token });
  } catch (err) {
    next(new AppError("Failed to generate API key", 500));
  }
};

export default { generateKey };
