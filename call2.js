require("dotenv").config();

const { HindsightClient } = require("@vectorize-io/hindsight-client");
const Groq = require("groq-sdk");

const hindsight = new HindsightClient({
    baseUrl: "https://api.hindsight.vectorize.io",
    apiKey: process.env.HINDSIGHT_API_KEY
});

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const BANK_ID = "recruiter-memory-v2";

async function main() {

    console.log("📅 CALL 2 — A few weeks later...\n");

    // Ask Hindsight what it remembers about Rashi
    const memory = await hindsight.recall(
        BANK_ID,
        "What did Rashi previously say about her job preferences, salary expectations, work setup, and work-life balance?"
    );

    console.log("🧠 Hindsight remembered:");
    console.log(memory.results[0].text);

    // Give the remembered information to Groq
    console.log("\n🤖 Agent is using the old memory...\n");

    const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
            {
                role: "system",
                content:
                    "You are a recruiter relationship assistant. Use remembered candidate information to help the recruiter prepare for a conversation. Never make the hiring decision yourself."
            },
            {
                role: "user",
                content: `
Here is information remembered from a previous conversation with Rashi:

${memory.results[0].text}

A few weeks have passed. The recruiter is considering Rashi for a new software engineering role.

The new role offers:
- Hybrid work
- ₹13 LPA
- A structured team with predictable working hours

Write a short personalized message the recruiter could use when reconnecting with Rashi. Make it clear that the message is based on what she previously told the recruiter.
`
            }
        ]
    });

    console.log("💼 Recruiter Agent:");
    console.log(response.choices[0].message.content);
}

main().catch((error) => {
    console.error("❌ Something went wrong:");
    console.error(error);
});