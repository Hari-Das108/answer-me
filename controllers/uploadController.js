import { index } from "../vectorDB.js";
import { promises as fs } from "fs";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import { chunker } from "../utils/chunker.js";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import multer from "multer";

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (process.env.NODE_ENV === "production") cb(null, "/tmp");
    if (process.env.NODE_ENV === "development") cb(null, "trash");
  },

  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `document-${Date.now()}${ext}`);
  },
});

const multerFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/pdf",
  ];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Invalid file format! Please upload only pdf, text or docx files.",
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

export const uploadTextFile = upload.single("document");

export const validateInsert = catchAsync(async (req, res, next) => {
  const filePath = req.file?.path;

  if (!filePath) {
    return next(new AppError("'document' field is required.", 400));
  }

  let fileContent;

  if (filePath.endsWith(".txt")) {
    fileContent = await fs.readFile(filePath, "utf-8");
  } else if (filePath.endsWith(".pdf")) {
    const parser = new PDFParse({ url: filePath });
    const result = await parser.getText();

    fileContent = result.text;
    await parser.destroy();
  } else if (filePath.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ path: filePath });
    fileContent = result.value;
  } else {
    return next(new AppError("Unsupported file type.", 400));
  }

  req.body.texts = fileContent;
  next();
});

export const chunkTexts = (req, res, next) => {
  const { texts } = req.body;
  const filePath = req.file?.path;
  let chunks;

  if (filePath.endsWith(".pdf")) {
    let cleaned = texts.replace(/\n-- \d+ of \d+ --\n\n/g, "");
    chunks = chunker(cleaned);
  } else {
    chunks = texts
      .split(/\n+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

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
  let { chunks } = req.body;

  chunks = chunks.filter((chunk) => chunk !== "");

  try {
    const records = chunks.map((text) => ({
      _id: uuidv4(),
      text,
    }));

    const namespace = index.namespace(`${req.user.id}-namespace-${req.iat}`);

    await namespace.upsertRecords(records);

    res.status(200).json({
      status: "success",
      message: `Successfully inserted text file with ${chunks.length} chunks.`,
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
