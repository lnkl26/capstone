const { onRequest } = require("firebase-functions/v2/https");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { defineSecret } = require("firebase-functions/params");

//define the secret name
const geminiKey = defineSecret("GEMINI_API_KEY");

//one single export using the secrets array
exports.suggestSubtasks = onRequest({ cors: true, secrets: [geminiKey] }, async (req, res) => {
    try {
        const taskName = req.query.taskName;
        if (!taskName) return res.status(400).send("Task name is missing");

        //pull the key value safely inside the function
        const apiKey = geminiKey.value();
        const genAI = new GoogleGenerativeAI(apiKey);

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); 
        
        const prompt = `
        You are an executive function coach for people with ADHD. 
        Break the task "${taskName}" into 3 tiny, concrete steps.

        Rules:
        1. Start with a "micro-action" (something that takes < 2 minutes).
        2. Use low-energy, encouraging language.
        3. No abstract goals (e.g., instead of "Be productive," use "Open the laptop").
        4. Keep each step under 6 words.
        5. Separate steps with semicolons.

        Example: Put one dish in the dishwasher; Wipe a small spot on counter; Toss one piece of trash.

        Response:`;

        const result = await model.generateContent(prompt);
        const text = result.response.candidates[0].content.parts[0].text;
        
        const subtasks = text.split(';').map(s => s.trim()).filter(s => s.length > 0);
        res.json({ subtasks });
        
    } catch (error) {
        console.error("DETAILED_ERROR:", error.message);
        res.status(500).json({ error: error.message });
    }
});