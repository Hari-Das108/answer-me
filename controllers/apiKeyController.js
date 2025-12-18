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
  const apiKeys = await ApiKey.find({ userId: req.user.id });

  res.status(200).json({
    status: "success",
    results: apiKeys.length,
    data: {
      apiKeys,
    },
  });
});

export const deleteApiKey = catchAsync(async (req, res, next) => {
  const apiKey = await ApiKey.findByIdAndDelete(req.params.id);

  if (!apiKey) {
    return next(new AppError("No Api-Key found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

export default { generateKey, getAllApiKeys, deleteApiKey };
