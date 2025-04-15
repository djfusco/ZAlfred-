const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports = async function handler(req, res) {
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
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant that finds family-safe YouTube videos." },
        { role: "user", content: safePrompt }
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    res.status(200).json(completion.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "OpenAI error", details: err.message });
  }
};
