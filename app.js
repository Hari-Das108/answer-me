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

// ======================================================
// 1. CONFIGURATION
// ======================================================

const strictCors = cors({
  origin: function (origin, callback) {
    const whitelist = [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://the-rag.netlify.app",
    ];
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
});

const publicCors = cors({
  origin: "*",
  credentials: false,
});

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// ======================================================
// 2. INTELLIGENT ROUTING (The Magic Fix)
// ======================================================

// A. STRICT ROUTES (API Key)
// This is easy because it has a unique path prefix "/api" (no v1)
app.use("/api", strictCors, apiKeyRouter);

// B. MIXED ROUTES (/api/v1)
// We create a "Gateway" middleware to decide which CORS to use based on the sub-path
const corsGateway = (req, res, next) => {
  // List of paths inside /api/v1 that need STRICT rules (Cookies)
  // Matches: /api/v1/login, /api/v1/signup, /api/v1/me, etc.
  if (req.url.match(/^\/(login|signup|logout|me)/)) {
    strictCors(req, res, next);
  } else {
    // Everything else (uploads, queries) gets PUBLIC rules
    publicCors(req, res, next);
  }
};

// Apply the Gateway + The Routers
// This keeps your URLs exactly as /api/v1/login, /api/v1/upload, etc.
app.use("/api/v1", corsGateway);
app.use("/api/v1", userRouter);
app.use("/api/v1", uploadRouter);
app.use("/api/v1", queryRouter);

// ======================================================

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
