// file: gpt.js
// Updated for ESM format with current OpenAI SDK

// Change this:
// import { Configuration, OpenAIApi } from "openai";

// To this ESM import:
import OpenAI from 'openai';

// Initialize the client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Export any functions you need
export async function createCompletion(prompt) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant that finds family-safe YouTube videos." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 150,
    });
    
    return completion.choices[0];
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

// If you need to maintain compatibility with your existing API handler
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const userPrompt = req.body.prompt;

  const safePrompt = `Please respond with only a single YouTube video URL that is:
- family-friendly
- educational or informative
- appropriate for all ages
- not political, violent, or sensitive

User request: "${userPrompt}"`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant that finds family-safe YouTube videos." },
        { role: "user", content: safePrompt }
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    res.status(200).json(completion.choices[0]);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "OpenAI error", details: err.message });
  }
}
