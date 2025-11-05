import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const index = pc.index(
  process.env.PINECONE_INDEX_NAME,
  process.env.PINECONE_INDEX_HOST
);

export { index };
