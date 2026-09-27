require("dotenv").config();

const express = require("express");
const { HindsightClient } = require("@vectorize-io/hindsight-client");
const Groq = require("groq-sdk");

const app = express();

const hindsight = new HindsightClient({
    baseUrl: "https://api.hindsight.vectorize.io",
    apiKey: process.env.HINDSIGHT_API_KEY
});

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const BANK_ID = "recall-demo";

app.use(express.json());
app.use(express.static("public"));


// =====================================================
// REMEMBER CANDIDATE CONVERSATION
// =====================================================

app.post("/api/remember", async (req, res) => {

    try {

        console.log("🧠 Analyzing recruiter conversation...");

        const conversation = `
Recruiter: What kind of role are you currently looking for?

Rashi: I'm looking for backend engineering opportunities.
I'd especially like to work with Node.js and take on more backend responsibility.

Recruiter: Where would you prefer to work?

Rashi: Hyderabad would be my first preference. Hybrid would be ideal.
I don't want to relocate immediately unless the opportunity is really suitable.

Recruiter: What are your salary expectations?

Rashi: I'm currently making ₹10 LPA and I'm looking for around ₹13–15 LPA.

Recruiter: What kind of work environment do you prefer?

Rashi: I value clear communication, reasonable working hours and work-life balance.
I don't want a company where frequent late-night work is normal.
I also want to avoid very high-pressure startup environments.
`;

        const response = await groq.chat.completions.create({

            model: "openai/gpt-oss-120b",

            messages: [

                {
                    role: "system",

                    content: `
You are a recruiter memory assistant.

Read the recruiter conversation and extract only useful
long-term candidate information that may matter in future
recruiting conversations.

Focus on:
- career goals
- technical interests
- location preferences
- work model preferences
- salary expectations
- work-style preferences
- important constraints

Do not include small talk.

Do not make hiring decisions.

Return only concise bullet points.
`
                },

                {
                    role: "user",
                    content: conversation
                }

            ]

        });

        const importantFacts = response.choices[0].message.content;

        console.log("📌 Important candidate information extracted.");

        await hindsight.retain(
            BANK_ID,
            `
Important candidate information from a recruiter conversation
with Rashi Sharma:

${importantFacts}
`
        );

        console.log("💾 Candidate memory saved to Hindsight.");

        res.json({
            success: true,
            message: "Important candidate preferences were remembered.",
            memory: importantFacts
        });

    } catch (error) {

        console.error("❌ Memory error:");
        console.error(error);

        res.status(500).json({
            success: false,
            error: "Unable to remember the conversation."
        });

    }

});


// =====================================================
// RECALL CANDIDATE CONTEXT
// =====================================================

app.post("/api/recruiter-brief", async (req, res) => {

    try {

        console.log("🔎 Recalling Rashi's memory...");

        const memory = await hindsight.recall(
            BANK_ID,
            "What are Rashi's career interests, location preferences, salary expectations, work-style preferences, and important constraints?"
        );

        const rememberedInformation = memory.results
            .map(item => item.text)
            .join("\n");

        console.log("🧠 Memory recalled.");

        const response = await groq.chat.completions.create({

            model: "openai/gpt-oss-120b",

            messages: [

                {
                    role: "system",

                    content: `
You are a recruiter relationship assistant.

Your job is to surface useful information from a candidate's
previous conversations.

Use ONLY the candidate information provided in memory.

Compare that remembered information with the new opportunity.

Do NOT make a hiring decision.

Do NOT say:
- strong fit
- weak fit
- perfect fit
- good candidate
- bad candidate
- should hire
- should reject

Do NOT invent information.

Keep the response concise.

Return EXACTLY this format:

SUMMARY:
One short paragraph explaining the relevant candidate context
and how the opportunity relates to it.

MATCHES:
- Specific alignment
- Specific alignment
- Specific alignment
- Specific alignment

VERIFY:
- One important thing the recruiter should verify
- One additional thing the recruiter should verify

Focus only on information that is actually supported by memory.
`
                },

                {
                    role: "user",

                    content: `
Candidate: Rashi

Remembered information:
${rememberedInformation}

New opportunity:
- Role: Backend Engineer
- Location: Hyderabad
- Work setup: Hybrid
- Salary: ₹14 LPA
- Technology: Node.js
- Working hours: Predictable and structured

Generate the recruiter brief.
`
                }

            ]

        });

        const brief = response.choices[0].message.content;

        console.log("🤖 Recruiter brief generated.");

        res.json({
            success: true,
            brief: brief
        });

    } catch (error) {

        console.error("❌ Server error:");
        console.error(error);

        res.status(500).json({
            success: false,
            error: "Unable to generate recruiter brief."
        });

    }

});


// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`
🚀 Recall is running at http://localhost:${PORT}
`);

});