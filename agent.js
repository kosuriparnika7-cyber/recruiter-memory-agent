require("dotenv").config();

const { HindsightClient } = require("@vectorize-io/hindsight-client");
const Groq = require("groq-sdk");

// -------------------------
// Connect to Hindsight
// -------------------------
const hindsight = new HindsightClient({
    baseUrl: "https://api.hindsight.vectorize.io",
    apiKey: process.env.HINDSIGHT_API_KEY
});

// -------------------------
// Connect to Groq
// -------------------------
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const BANK_ID = "recruiter-memory-v2";

async function main() {

    console.log("🔎 Finding what we remember about Rashi...");

    // Ask Hindsight for relevant candidate memory
    const memory = await hindsight.recall(
        BANK_ID,
        "What does Rashi care about when choosing her next job?"
    );

    console.log("\n🧠 Hindsight memory found:");
    console.log(memory.results[0].text);

    // Give that memory to Groq
    console.log("\n🤖 Asking Groq to use the memory...");

    const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
            {
                role: "system",
                content:
                    "You are a recruiter assistant. Use the candidate memory provided to give concise, useful context to a recruiter. Do not make hiring decisions."
            },
            {
                role: "user",
                content: `
Candidate memory:
${memory.results[0].text}

The recruiter is considering this candidate for a new software engineering role.

Tell the recruiter what they should remember about this candidate and what they may want to discuss with her.
`
            }
        ]
    });

    console.log("\n💼 Recruiter Agent:");
    console.log(response.choices[0].message.content);
}

main().catch((error) => {
    console.error("\n❌ Something went wrong:");
    console.error(error);
});