import { pipeline } from "@xenova/transformers";
import { Pinecone } from "@pinecone-database/pinecone";

// --- Configuration ---
const OPENROUTER_API_KEY =
  "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"; // Replace with your key

// 1. Initialize Model outside for performance
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

// --- Helper: LLM Translation via OpenRouter ---
async function getLLMTranslation(text, targetLang) {
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct:free", // Fast and efficient for translation
          messages: [
            {
              role: "system",
              content: `You are a professional translator. Translate the text to language code: ${targetLang}. Return ONLY the translation.`,
            },
            { role: "user", content: text },
          ],
        }),
      },
    );
    const data = await response.json();
    return (
      data.choices?.[0]?.message?.content?.trim() || "Translation unavailable"
    );
  } catch (error) {
    console.error("LLM Error:", error);
    return "Translation Error";
  }
}

// --- Helper: Create Embedding ---
async function createEmbedding(text) {
  const embedding = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(embedding.data);
}

// --- Main Controller ---
export const categorizeStrings = async (req, res) => {
  try {
    const { texts, lang = "hi" } = req.body;

    if (!texts || !Array.isArray(texts)) {
      return res
        .status(400)
        .json({ error: "Invalid input. 'texts' must be an array." });
    }

    const results = {
      exact: [],
      fuzzy: [],
      new: [],
    };

    // Use Promise.all to process all strings in parallel
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

        // Categorization Logic
        if (score >= 0.99) {
          // EXACT MATCH: Return stored translation
          results.exact.push({
            text: text,
            score: Number(score.toFixed(4)),
            translation:
              bestMatch.metadata?.translation || "No translation found",
          });
        } else if (score >= 0.75 && score < 0.99) {
          // FUZZY MATCH: Get LLM suggestion alongside existing DB match
          const suggestion = await getLLMTranslation(text, lang);
          results.fuzzy.push({
            text: text,
            score: Number(score.toFixed(4)),
            matchText: bestMatch.metadata?.text || null,
            existingMatchTranslation: bestMatch.metadata?.translation || null,
            suggested_translation: suggestion,
          });
        } else {
          // NEW: Get fresh LLM translation
          const suggestion = await getLLMTranslation(text, lang);
          results.new.push({
            text: text,
            score: Number(score.toFixed(4)),
            suggested_translation: suggestion,
          });
        }
      }),
    );

    return res.status(200).json(results);
  } catch (error) {
    console.error("Categorization Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export default { categorizeStrings };
