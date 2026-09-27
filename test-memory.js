require("dotenv").config();

const { HindsightClient } = require("@vectorize-io/hindsight-client");

const client = new HindsightClient({
    baseUrl: "https://api.hindsight.vectorize.io",
    apiKey: process.env.HINDSIGHT_API_KEY
});

const BANK_ID = "recruiter-memory-v2";

async function main() {
    console.log("Connecting to Hindsight...");

    await client.retain(
        BANK_ID,
        "Candidate Rashi said she prefers hybrid work, expects a salary of ₹12–15 LPA, and wants to avoid high-pressure startup environments because work-life balance is important to her."
    );

    console.log("✅ Candidate memory stored!");

    const result = await client.recall(
        BANK_ID,
        "What does Rashi care about when choosing her next job?"
    );

    console.log("\n🧠 Hindsight recalled:");
    console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
    console.error("❌ Something went wrong:");
    console.error(error);
});