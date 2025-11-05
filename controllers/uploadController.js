import { index } from "../vectorDB.js";
import { promises as fs } from "fs";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";

import multer from "multer";

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "/tmp"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `textfile-${Date.now()}${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("text")) {
    cb(null, true);
  } else {
    cb(
      new AppError("Not a text file! Please upload only text files.", 400),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

export const uploadTextFile = upload.single("textFile");

export const validateInsert = catchAsync(async (req, res, next) => {
  const filePath = req.file?.path;

  if (!filePath) {
    return next(new AppError("'textFile' is required.", 400));
  }

  const fileContent = await fs.readFile(filePath, "utf-8");
  req.body.texts = fileContent;

  next();
});

export const chunkTexts = (req, res, next) => {
  const { texts } = req.body;

  const chunks = texts
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (chunks.length === 0) {
    return next(
      new AppError(
        "No text content found in file. Splitting by paragraph resulted in 0 chunks.",
        400
      )
    );
  }

  req.body.chunks = chunks;
  next();
};

export const insertText = async (req, res, next) => {
  const { chunks } = req.body;

  try {
    const records = chunks.map((text, index) => ({
      _id: uuidv4(),
      text,
    }));

    const token = req.headers["x-api-key"];
    const payload = JSON.parse(atob(token.split(".")[1]));
    const iat = payload.iat;

    const namespace = index.namespace(`${req.userId}-namespace-${iat}`);

    await namespace.upsertRecords(records);

    res.status(200).json({
      status: "success",
      message: `Successfully inserted ${recordsLength} text chunks.`,
    });
  } catch (error) {
    return next(new AppError("Failed to insert text chunks.", 500));
  } finally {
    if (req.file?.path) {
      try {
        await fs.unlink(req.file.path);
      } catch {}
    }
  }
};

export default {
  uploadTextFile,
  validateInsert,
  chunkTexts,
  insertText,
};
