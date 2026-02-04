require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY");
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    let output = "";
    if (data.models) {
        output += "Available Models:\n";
        data.models.forEach(m => {
            if (m.name.includes('gemini')) {
                output += `- ${m.name}\n`;
            }
        });
    } else {
        output += "Error or no models found: " + JSON.stringify(data, null, 2);
    }
    
    fs.writeFileSync('available_models.txt', output);
    console.log("Written to available_models.txt");

  } catch (error) {
    console.error("Fetch error:", error);
  }
}

listModels();
