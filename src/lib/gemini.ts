import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_GEMINI_MODEL = "gemini-flash-latest";
const MAX_OVERVIEW_LENGTH = 900;

const buildOverviewPrompt = (destination: string) => {
  return [
    "Write a concise travel overview in 3-5 sentences.",
    "Use plain text only. No bullet points or markdown.",
    "Include 2-3 highlights and the best time of year to visit.",
    `Destination: ${destination}.`,
  ].join(" ");
};

export const getGeminiPlaceOverview = async (
  destination: string
): Promise<string | null> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY");
    return null;
  }

  const modelName = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt = buildOverviewPrompt(destination);

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 220,
      },
    });

    const response = result.response;
    const text = response.text();

    if (!text) return null;

    return text.length > MAX_OVERVIEW_LENGTH
      ? text.slice(0, MAX_OVERVIEW_LENGTH).trim()
      : text.trim();
  } catch (error) {
    console.error("Gemini API request failed:", error);
    return null;
  }
};
