const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
env.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) {
    let value = val.join('=').trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    process.env[key.trim()] = value;
  }
});

const { GoogleGenAI } = require('@google/genai');

async function main() {
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: 'Hello',
      config: { tools: [{ googleSearch: {} }] }
    });
    console.log('Success:', response.text);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
