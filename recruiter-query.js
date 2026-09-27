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

    console.log("🔎 Recruiter is checking Rashi's history...\n");

    // Ask Hindsight for relevant memories
    const memory = await hindsight.recall(
        BANK_ID,
        "What are Rashi's current career interests, location preferences, salary expectations, work-style preferences, and important constraints?"
    );

    console.log("🧠 Relevant candidate memory:");
    
    for (const item of memory.results) {
        console.log("-", item.text);
    }

    const rememberedInformation = memory.results
        .map(item => item.text)
        .join("\n");

    // Give the memories to Groq
    console.log("\n🤖 Generating recruiter guidance...\n");

    const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
            {
                role: "system",
                content: `
You are a recruiter relationship assistant.

Use only the candidate information provided in memory.

Your job is to:
1. Summarize relevant candidate preferences.
2. Explain which parts of the new role match those preferences.
3. Point out anything the recruiter should clarify.

Do NOT make a hiring decision.
Do NOT claim the candidate will accept the role.
Do NOT invent information.
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

What should the recruiter know before contacting Rashi?
`
            }
        ]
    });

    console.log("💼 Recruiter Agent:\n");
    console.log(response.choices[0].message.content);
}

main().catch((error) => {
    console.error("❌ Something went wrong:");
    console.error(error);
});