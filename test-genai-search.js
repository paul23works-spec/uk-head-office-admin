const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
env.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) process.env[key.trim()] = val.join('=').trim();
});
const { GoogleGenAI } = require('@google/genai');

async function main() {
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: [{ role: 'user', parts: [{ text: 'What is the top news headline globally today?' }] }],
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    console.log('Success:', response.text);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
