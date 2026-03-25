import { pipeline } from "@xenova/transformers";
import { Pinecone } from "@pinecone-database/pinecone";

// 1. Initialize outside the controller for performance
let extractor;
const initModel = async () => {
  if (!extractor) {
    extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
};
initModel();

const pc = new Pinecone({
  apiKey:
    "pcsk_A9aQi_LWxcEAaC4NiLVvgMAB6YXya4StFvhZKz5tFaTKMmHjMqqT16mhuwmyycoes8C5Z",
});

const index = pc.index(
  "translation-memory",
  "https://translation-memory-m7iybz0.svc.aped-4627-b74a.pinecone.io",
);

const namespace = index.namespace("en-hi");

// --- Helper: Create Embedding ---
async function createEmbedding(text) {
  const embedding = await extractor(text, {
    pooling: "mean",
    normalize: true,
  });
  return Array.from(embedding.data);
}

// --- Controller Function ---
export const categorizeStrings = async (req, res) => {
  try {
    const { texts } = req.body;

    // Validation
    if (!texts || !Array.isArray(texts)) {
      return res
        .status(400)
        .json({ error: "Invalid input. 'texts' must be an array of strings." });
    }

    const results = {
      exact: [],
      fuzzy: [],
      new: [],
    };

    await Promise.all(
      texts.map(async (text) => {
        const queryVector = await createEmbedding(text);

        const response = await namespace.query({
          vector: queryVector,
          topK: 1,
          includeMetadata: true,
        });

        const bestMatch = response.matches?.[0];
        const score = bestMatch ? bestMatch.score : 0;

        // Create a detailed result object
        const detail = {
          text: text,
          score: Number(score.toFixed(4)), // e.g., 0.8543
          translation: bestMatch?.metadata?.translation || null,
        };

        // Threshold Logic
        if (score >= 0.8 && score < 0.99) {
          results.fuzzy.push(detail);
        } else if (score < 0.8) {
          // For "new" items, match details aren't relevant since the score is too low
          results.new.push({ text: text, score: score });
        } else {
          results.exact.push(detail);
        }
      }),
    );

    return res.status(200).json(results);
  } catch (error) {
    console.error("Vector Search Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export default {
  categorizeStrings,
};
