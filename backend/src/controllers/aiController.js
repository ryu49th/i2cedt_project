const OpenAI = require("openai");
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// POST /api/generate
exports.generatePlan = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "No prompt provided" });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",   // or "gpt-4.1-mini" if you prefer
      messages: [
        { role: "system", content: "You are a project planning assistant." },
        { role: "user", content: prompt }
      ],
      max_tokens: 400
    });

    const text = completion.choices[0].message.content;
    res.json({ plan: text });
  } catch (err) {
    console.error("AI error:", err);
    res.status(500).json({ error: err.message });
  }
};
