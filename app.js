import express from "express";
import morgan from "morgan";
import cors from "cors";
import path from "path";
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

const allowedOrigins = ["https://the-rag.netlify.app", "http://localhost:5173"];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      const isLocalNetwork =
        /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1]))/.test(origin);

      if (allowedOrigins.includes(origin) || isLocalNetwork) {
        callback(null, true);
      } else {
        console.warn("❌ Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

// app.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();
//   // console.log(req.headers);
//   next();
// });

app.use("/api/v1", uploadRouter);
app.use("/api/v1", queryRouter);
app.use("/api/v1", userRouter);
app.use("/api", apiKeyRouter);

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
