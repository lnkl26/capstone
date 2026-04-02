const { onRequest } = require("firebase-functions/v2/https");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { defineSecret } = require("firebase-functions/params");

//define the secret name
const geminiKey = defineSecret("GEMINI_API_KEY");
// FoodData Central API key secret
const fdcKey = defineSecret("FDC_API_KEY");

//one single export using the secrets array
exports.suggestSubtasks = onRequest(
    { cors: true, secrets: [geminiKey] },
    async (req, res) => {
        try {
            const taskName = req.query.taskName;
            if (!taskName) return res.status(400).send("Task name is missing");

            //pull the key value safely inside the function
            const apiKey = geminiKey.value();
            const genAI = new GoogleGenerativeAI(apiKey);

            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
            });

            const prompt = `
        You are an executive function coach helping a user overcome task paralysis. 
        Break the task "${taskName}" into 3 to 5 actionable, sequential subtasks that make a meaningful dent in the overall goal.

        Rules:
        1. Step 1 should be a low-friction "activation" step to build momentum (e.g., gathering materials or clearing the workspace).
        2. Steps 2 and 3 should tackle the core components of the task.
        3. Use concrete, action-oriented language. No abstract goals.
        4. Keep each step under 10 words.
        5. Output ONLY the 3 to 5 steps, separated by a semicolon (;). Do not include labels like "Step 1".

        Examples:
        Task: "Clean Kitchen"
        Response: Gather all trash into one bag; Load plates and cups into the dishwasher; Wipe down the main prep counter.

        Task: "Write Essay"
        Response: Open a blank document and type the title; Write down three bullet points for main arguments; Draft a rough introduction paragraph.

        Task: "${taskName}"
        Response:`;

            const result = await model.generateContent(prompt);
            const text = result.response.candidates[0].content.parts[0].text;

            const subtasks = text
                .split(";")
                .map((s) => s.trim())
                .filter((s) => s.length > 0);
            res.json({ subtasks });
        } catch (error) {
            console.error("DETAILED_ERROR:", error.message);
            res.status(500).json({ error: error.message });
        }
    },
);

// Proxy search to FoodData Central
exports.searchFoods = onRequest(
    { cors: true, secrets: [fdcKey] },
    async (req, res) => {
        try {
            const apiKey = fdcKey.value();

            // Support GET and POST
            if (req.method === "GET") {
                const q = req.query.query;
                if (!q) return res.status(400).send("query param is required");

                const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(q)}`;
                const fdcRes = await fetch(url, { method: "GET" });
                const data = await fdcRes.json();
                return res.json(data);
            }

            // forwards JSON body to FDC search endpoint
            if (req.method === "POST") {
                const body = req.body || {};
                const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${encodeURIComponent(apiKey)}`;
                const fdcRes = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                });
                const data = await fdcRes.json();
                return res.json(data);
            }

            res.status(405).send("Method not allowed");
        } catch (error) {
            console.error("FDC_SEARCH_ERROR:", error);
            res.status(500).json({ error: error.message });
        }
    },
);

// Gets food details by FDC ID
exports.getFoodById = onRequest(
    { cors: true, secrets: [fdcKey] },
    async (req, res) => {
        try {
            const apiKey = fdcKey.value();
            const id =
                req.params && req.params[0]
                    ? req.params[0]
                    : req.query.id || req.path.split("/").pop();
            // Normalizes ID
            const fdcId = id || req.query.fdcId;
            if (!fdcId) return res.status(400).send("fdc id is required");

            const url = `https://api.nal.usda.gov/fdc/v1/food/${encodeURIComponent(fdcId)}?api_key=${encodeURIComponent(apiKey)}`;
            const fdcRes = await fetch(url, { method: "GET" });
            const data = await fdcRes.json();
            res.json(data);
        } catch (error) {
            console.error("FDC_DETAILS_ERROR:", error);
            res.status(500).json({ error: error.message });
        }
    },
);
