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

const BANK_ID = "recall-demo";

async function rememberConversation() {

    console.log("🧠 Analyzing recruiter conversation...");

    // This represents the conversation between the recruiter and Rashi.
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

    // Ask Groq to identify only the information
    // that would actually be useful in future conversations.
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

    console.log("\n📌 Important information found:\n");
    console.log(importantFacts);

    console.log("\n💾 Saving important information to Hindsight...");

    await hindsight.retain(
        BANK_ID,
        `
Important candidate information from a recruiter conversation
with Rashi Sharma:

${importantFacts}
`
    );

    console.log("\n✅ Conversation remembered successfully.");
}

rememberConversation().catch((error) => {

    console.error("\n❌ Something went wrong:");
    console.error(error);

});