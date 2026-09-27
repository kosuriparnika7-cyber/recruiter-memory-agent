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

    console.log("📞 Processing Rashi's conversation...\n");

    const conversation = `
Recruiter: Tell me what you're looking for in your next role.

Rashi: I'm currently working as a software engineer.
I'm open to moving for the right opportunity, but I would prefer Hyderabad
or a hybrid role because I don't want to relocate immediately.

I'm currently earning around ₹10 LPA, so I'm looking for something
around ₹13–15 LPA.

I really enjoyed my previous team because everyone communicated clearly
and I had reasonable working hours. I don't want to go back to a company
where people constantly work late.

I'm also interested in backend development and would like my next role
to give me more opportunities to work with Node.js.
`;

    console.log(conversation);

    // Ask Groq to identify information worth remembering
    console.log("\n🤖 Groq is identifying important candidate information...");

    const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        messages: [
            {
                role: "system",
                content: `
You are a recruiter memory assistant.

Read the candidate conversation and identify information that would
be useful for a recruiter to remember in future conversations.

Focus on:
- work preferences
- location preferences
- salary expectations
- career goals
- skills/interests
- important dislikes or constraints

Do not include irrelevant small talk.

Return only concise bullet points.
`
            },
            {
                role: "user",
                content: conversation
            }
        ]
    });

    const importantMemory = response.choices[0].message.content;

    console.log("\n🧠 Information worth remembering:");
    console.log(importantMemory);

    // Store the extracted memory in Hindsight
    await hindsight.retain(
        BANK_ID,
        `Important information learned about candidate Rashi:\n${importantMemory}`
    );

    console.log("\n✅ Important candidate information stored in Hindsight!");
}

main().catch((error) => {
    console.error("\n❌ Something went wrong:");
    console.error(error);
});