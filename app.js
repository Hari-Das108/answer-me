import express from "express";
// import morgan from "morgan";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import AppError from "./utils/appError.js";
import globalErrorHandler from "./controllers/errorController.js";
import uploadRouter from "./routes/uploadRoutes.js";
import queryRouter from "./routes/queryRoutes.js";
import apiKeyRouter from "./routes/apiKeyRoutes.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

// if (process.env.NODE_ENV === "development") {
//   app.use(morgan("dev"));
// }

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.use("/api/v1", uploadRouter);
app.use("/api/v1", queryRouter);
app.use("/api", apiKeyRouter);

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

export default app;
