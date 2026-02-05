const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // The SDK doesn't always expose listModels directly on the main class in all versions, 
    // but we can try to use the model directly or just check documentation.
    // Actually, for the SDK, we typically instantiate a model. 
    // There isn't a direct "listModels" method on the `GoogleGenerativeAI` class instance in the JS SDK usually,
    // it's often a separate API call.
    // However, we can try to just run a generation with 'gemini-pro' to see if that works, 
    // and 'gemini-1.5-flash-001' to see if that works.

    console.log("Testing gemini-1.5-flash-001...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-1.5-flash-001");
    } catch (e) {
        console.log("Failed with gemini-1.5-flash-001: " + e.message);
    }

    console.log("Testing gemini-1.5-flash...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-1.5-flash");
    } catch (e) {
        console.log("Failed with gemini-1.5-flash: " + e.message);
    }

    console.log("Testing gemini-pro...");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("Success with gemini-pro");
    } catch (e) {
        console.log("Failed with gemini-pro: " + e.message);
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

listModels();
