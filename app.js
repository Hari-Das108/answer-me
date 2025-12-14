import cors from "cors";
import express from "express";
import morgan from "morgan";
import path from "path";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";

import AppError from "./utils/appError.js";
import globalErrorHandler from "./controllers/errorController.js";
import uploadRouter from "./routes/uploadRoutes.js";
import queryRouter from "./routes/queryRoutes.js";
import userRouter from "./routes/userRoutes.js";
import apiKeyRouter from "./routes/apiKeyRoutes.js";

const app = express();
app.set("trust proxy", 1);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// 1. Define the whitelist
// const whitelist = ["http://localhost:5173", "https://the-rag.netlify.app"];

// 2. Define the config OBJECT once (so we can use it twice)
const corsOptions = {
  origin: "*",
  credentials: true, // Allow cookies
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
};

// 3. Use the config for standard requests
app.use(cors(corsOptions));

// 4. Use the SAME config for Preflight (OPTIONS) requests
// app.options(/.*/, cors(corsOptions));

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use("/api/v1", uploadRouter);
app.use("/api/v1", queryRouter);
app.use("/api/v1", userRouter);
app.use("/api", apiKeyRouter);

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
