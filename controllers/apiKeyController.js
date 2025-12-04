import { createApiKey } from "../utils/generateKey.js";
import AppError from "../utils/appError.js";
import ApiKey from "../models/apiKeyModel.js";
import catchAsync from "../utils/catchAsync.js";

export const generateKey = catchAsync(async (req, res, next) => {
  const newKey = createApiKey();
  const newApiKey = await ApiKey.create({
    apiKey: newKey,
    userId: req.user.id,
  });

  res.json({ status: "success", apiKey: newApiKey.apiKey });
});

export default { generateKey };
