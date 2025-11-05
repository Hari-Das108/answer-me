import { index } from "../vectorDB.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";

export const validateQueries = (req, res, next) => {
  const { questions } = req.body;

  if (!Array.isArray(questions) || questions.length === 0) {
    return next(
      new AppError("A non-empty 'questions' array is required.", 400)
    );
  }

  next();
};

export const getContexts = catchAsync(async (req, res, next) => {
  const { questions } = req.body;

  const token = req.headers["x-api-key"];
  const payload = JSON.parse(
    Buffer.from(token.split(".")[1], "base64").toString("utf-8")
  );
  const iat = payload.iat;

  const namespace = index.namespace(`${req.userId}-namespace-${iat}`);

  const responses = await Promise.all(
    questions.map((question) =>
      namespace.searchRecords({
        query: {
          topK: 2,
          inputs: { text: question },
        },
        fields: ["text"],
      })
    )
  );

  const contexts = responses.map((r, i) =>
    r.result.hits
      .map((hit) => hit.fields.text)
      .filter(Boolean)
      .join(` | `)
  );

  if (contexts.some((context) => context.trim() === "")) {
    return next(new AppError("First Upload a text file.", 400));
  }

  req.contexts = contexts;
  next();
});

export const getLLMResponses = catchAsync(async (req, res, next) => {
  const { questions } = req.body;
  const { contexts } = req;

  const fetchAnswer = async (question, context) => {
    const systemPrompt = `You are a helpful assistant. Use the following context to answer the user's question. 
    Respond with ONLY a JSON object in the format: { "answer": "your_answer_here" }.
    If the context does not provide an answer, the "answer" value should be "I don't know (may be question is out of Context)"

    Context:
    ${context || "No context provided."}`;

    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: `${process.env.OPENROUTER_MODEL_NAME}`,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: question },
            ],
            response_format: { type: "json_object" },
          }),
        }
      );

      if (!response.ok) {
        return `Error processing question: ${response.statusText}`;
      }

      const data = await response.json();

      try {
        const contentString = data?.choices[0]?.message?.content;
        const jsonAnswer = JSON.parse(contentString);

        return jsonAnswer.answer || "No 'answer' key found in JSON.";
      } catch (parseError) {
        return "Error: Invalid JSON format received from model.";
      }
    } catch (error) {
      return "An error occurred while getting the answer.";
    }
  };

  const answerPromises = questions.map((question, index) =>
    fetchAnswer(question, contexts[index])
  );

  const allAnswers = await Promise.all(answerPromises);

  res.locals.llmAnswer = allAnswers;
  next();
});

export function getAnswers(req, res) {
  res.json({
    status: "success",
    answers: res.locals.llmAnswer,
  });
}

export default { validateQueries, getContexts, getLLMResponses, getAnswers };
