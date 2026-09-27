require("dotenv").config();

const { HindsightClient } = require("@vectorize-io/hindsight-client");

const hindsight = new HindsightClient({
    baseUrl: "https://api.hindsight.vectorize.io",
    apiKey: process.env.HINDSIGHT_API_KEY
});

const BANK_ID = "recruiter-memory-v2";

async function main() {

    console.log("📞 CALL 1 — Talking to Rashi...\n");

    const conversation = `
Recruiter: What are you looking for in your next job?

Rashi: I want a role where I can work in a hybrid setup.
I'm targeting around ₹12–15 LPA.
I also don't want another high-pressure startup environment.
Work-life balance is really important to me.
`;

    console.log(conversation);

    // Store what we learned from the conversation
    await hindsight.retain(
        BANK_ID,
        `During a recruiter conversation, Rashi said: ${conversation}`
    );

    console.log("🧠 Rashi's preferences have been remembered by Hindsight.");
}

main().catch((error) => {
    console.error("❌ Something went wrong:");
    console.error(error);
});