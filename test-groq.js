require("dotenv").config();

const Groq = require("groq-sdk");

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

async function main() {
    console.log("Connecting to Groq...");

    const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
            {
                role: "user",
                content: "Say hello to our recruiter agent in one sentence."
            }
        ]
    });

    console.log("\n🧠 Groq replied:");
    console.log(response.choices[0].message.content);
}

main().catch((error) => {
    console.error("❌ Something went wrong:");
    console.error(error);
});