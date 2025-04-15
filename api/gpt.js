const { Configuration, OpenAIApi } = require("openai");
const fetch = require("node-fetch");

// Setup OpenAI client
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// YouTube API key (set this in Vercel env)
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const userPrompt = req.body.prompt;

  const safePrompt = `Please respond with only a single YouTube video URL that is:
- embeddable (does not block embedding)
- family-friendly
- educational or informative
- appropriate for all ages
- not political, violent, or sensitive

Only include the direct YouTube video URL in your response — do not add any explanation or extra text.

User request: "${userPrompt}"`;

  try {
    // Ask OpenAI for a safe video
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that finds embeddable, family-safe YouTube videos.",
        },
        {
          role: "user",
          content: safePrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    });

    const rawContent = completion.data.message?.content?.trim();

    if (!rawContent) {
      return res.status(400).json({ error: "No video URL returned" });
    }

    // Extract YouTube video ID
    const match = rawContent.match(/(?:v=|youtu.be\/)([\w-]{11})/);
    if (!match) {
      return res.status(400).json({ error: "Could not extract video ID from URL", rawContent });
    }

    const videoId = match[1];

    // Check embeddability with YouTube API
    const ytResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=status&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );
    const ytData = await ytResponse.json();

    if (!ytData.items || ytData.items.length === 0) {
      return res.status(404).json({ error: "Video not found in YouTube API" });
    }

    const videoStatus = ytData.items[0].status;
    if (!videoStatus.embeddable || videoStatus.privacyStatus !== "public") {
      return res.status(403).json({ error: "Video is not embeddable or not public" });
    }

    // Success!
    res.status(200).json({ message: { content: `https://www.youtube.com/watch?v=${videoId}` } });
  } catch (err) {
    console.error(err.response?.data || err.message || err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};
