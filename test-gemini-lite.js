const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config({ path: '.env.local' });

async function testModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = "gemini-2.0-flash-lite";

  console.log(`Testing ${modelName}...`);
  try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("Say hello briefly.");
      console.log(`Success with ${modelName}! Response: ${result.response.text()}`);
  } catch (e) {
      console.log(`Failed with ${modelName}: ` + e.message);
  }
}

testModel();
