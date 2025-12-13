import { createApiKey } from "../utils/generateKey.js";
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

export const getAllApiKeys = catchAsync(async (req, res, next) => {
  const apiKeys = await ApiKey.find({});

  res.status(200).json({
    status: "success",
    results: apiKeys.length,
    data: {
      apiKeys,
    },
  });
});

export default { generateKey, getAllApiKeys };
