import mongoose from "mongoose";

const apiKeySchema = new mongoose.Schema({
  apiKey: {
    type: String,
    required: [true, "Please provide an API key!"],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ApiKey = mongoose.model("ApiKey", apiKeySchema);

export default ApiKey;
