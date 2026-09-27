require("dotenv").config();

const { HindsightClient } = require("@vectorize-io/hindsight-client");

const client = new HindsightClient({
    baseUrl: "https://api.hindsight.vectorize.io",
    apiKey: process.env.HINDSIGHT_API_KEY
});

const BANK_ID = "recall-demo";

async function main() {

    console.log("🧠 Saving Rashi's conversation to Hindsight...");

    await client.retain(
        BANK_ID,
        `
Recruiter conversation with candidate Rashi Sharma:

Rashi is currently a Software Engineer with a backend focus.

She is looking for backend engineering opportunities, preferably in Hyderabad.
She is open to hybrid work and prefers not to relocate immediately unless the opportunity is particularly suitable.

Her current salary is ₹10 LPA and her expected salary is ₹13–15 LPA.

She wants to take on more backend development responsibilities, especially using Node.js.

She values clear communication, reasonable working hours, and a healthy work-life balance.

She wants to avoid companies where frequent late-night work, poor communication, or high-pressure startup culture are common.

These preferences were discussed during a recruiter conversation and may be useful when considering future opportunities for Rashi.
        `
    );

    console.log("✅ Rashi's conversation is now remembered.");
}

main().catch((error) => {

    console.error("❌ Something went wrong:");
    console.error(error);

});