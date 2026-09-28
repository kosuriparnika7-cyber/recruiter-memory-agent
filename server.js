require("dotenv").config();

const express = require("express");
const { HindsightClient } = require("@vectorize-io/hindsight-client");
const fs = require("node:fs/promises");
const path = require("node:path");
const Groq = require("groq-sdk");

const app = express();

const hindsight = new HindsightClient({
    baseUrl: "https://api.hindsight.vectorize.io",
    apiKey: process.env.HINDSIGHT_API_KEY
});

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const BANK_ID = "recall-demo-v2";
const RETAINED_RECORD_PATH = path.join(__dirname, ".hindsight-retained.json");
const INITIAL_CONVERSATION_ID = "rashi-initial-recruiter-conversation-v1";
const INITIAL_CONVERSATION_OPERATION_ID = "ea85af16-30a6-5e64-bafa-6d9645e4d824";
let initialRetainPromise;
const recalledMemoryCache = { followUp: "", today: "" };
const recalledFactsCache = { followUp: [], today: [] };

function normalizeMemoryItem(item) {
    return item.replace(/^[-•\s]+/, "").replace(/\s+/g, " ").trim();
}

function memoryItemKey(item) {
    return normalizeMemoryItem(item).toLocaleLowerCase().replace(/[.!?]+$/g, "");
}

function memoryItemCategory(item) {
    const text = item.toLocaleLowerCase();
    if (/salary|compensation|\b\d+\s*lpa\b|₹/.test(text)) return "compensation";
    if (/hyderabad|relocat|location/.test(text)) return "location";
    if (/hybrid|remote|onsite|work model/.test(text)) return "work-model";
    if (/node\.js|technology|tech stack/.test(text)) return "technology";
    if (/backend|career goal|role|engineering/.test(text)) return "career";
    if (/late-night|working hours|work-life|work style|high-pressure|startup/.test(text)) return "work-style";
    return "";
}

function uniqueMemoryItems(items, limit = 6) {
    const seen = new Set();
    return items.map(normalizeMemoryItem).filter(item => {
        const key = memoryItemKey(item);
        const category = memoryItemCategory(item);
        const dedupeKey = category || key;
        if (!key || seen.has(dedupeKey)) return false;
        seen.add(dedupeKey);
        return true;
    }).slice(0, limit);
}

async function retainInitialConversationOnce(content) {
    if (initialRetainPromise) return initialRetainPromise;
    initialRetainPromise = (async () => {
        let retained = {};
        try {
            retained = JSON.parse(await fs.readFile(RETAINED_RECORD_PATH, "utf8"));
        } catch (error) {
            if (error.code !== "ENOENT") throw error;
        }
        if (retained[INITIAL_CONVERSATION_ID]) return false;

        await hindsight.createBank(BANK_ID, {
            retainMission: "Remember durable candidate preferences, constraints, and career goals for recruiter follow-up."
        });
        await hindsight.retain(BANK_ID, content, {
            documentId: INITIAL_CONVERSATION_ID,
            operationId: INITIAL_CONVERSATION_OPERATION_ID,
            updateMode: "replace",
            async: true
        });
        retained[INITIAL_CONVERSATION_ID] = new Date().toISOString();
        await fs.writeFile(RETAINED_RECORD_PATH, JSON.stringify(retained, null, 2), "utf8");
        return true;
    })();
    try {
        return await initialRetainPromise;
    } finally {
        initialRetainPromise = undefined;
    }
}

async function recallCandidateMemory(query, stage = "today") {
    if (recalledMemoryCache[stage]) return recalledMemoryCache[stage];
    const memory = await hindsight.recall(BANK_ID, query, {
        includeSourceFacts: true,
        maxSourceFactsTokens: 2000
    });
    const recalledItems = [
        ...memory.results.map(item => item.text),
        ...Object.values(memory.source_facts || {}).map(item => item.text)
    ].filter(Boolean);
    recalledFactsCache[stage] = uniqueMemoryItems(recalledItems
        .flatMap(item => item.split(/\n|(?<=[.!?])\s+/)), 4)
        .map(item => item.length > 54 ? `${item.slice(0, 51).trimEnd()}…` : item);
    recalledMemoryCache[stage] = uniqueMemoryItems(recalledItems, 6)
        .map(item => item.length > 240 ? `${item.slice(0, 237).trimEnd()}…` : item)
        .join("\n");
    return recalledMemoryCache[stage];
}

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

        const retainPerformed = await retainInitialConversationOnce(
            `
Important candidate information from a recruiter conversation
with Rashi Sharma:

${importantFacts}
`
        );
        if (retainPerformed) {
            recalledMemoryCache.followUp = "";
            recalledMemoryCache.today = "";
            recalledFactsCache.followUp = [];
            recalledFactsCache.today = [];
        }

        console.log(retainPerformed ? "💾 Candidate memory saved to Hindsight." : "💾 Conversation was already retained; skipped duplicate Hindsight retain.");

        res.json({
            success: true,
            message: retainPerformed ? "Important candidate preferences were remembered." : "This conversation was already remembered.",
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
// RECALL MEMORY FOR THE ONE-WEEK FOLLOW-UP
// =====================================================

app.post("/api/follow-up", async (req, res) => {
    try {
        const rememberedInformation = await recallCandidateMemory(
            "What career goals, location and work-model preferences, compensation expectations, and work-style constraints did Rashi share that should guide a thoughtful recruiter follow-up?",
            "followUp"
        );

        if (!rememberedInformation.trim()) {
            return res.status(404).json({ success: false, error: "No candidate memory was found. Remember the initial conversation first." });
        }

        const response = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [
                { role: "system", content: "You are a recruiter relationship assistant. Use only recalled memory. Draft one concise, natural follow-up question that reflects a relevant preference and asks whether it still holds. Do not invent details or make a hiring decision." },
                { role: "user", content: "One week after the initial conversation, use this Hindsight memory to draft a personalized follow-up for Rashi.\n\nRecalled memory:\n" + rememberedInformation }
            ]
        });

        res.json({ success: true, memory: rememberedInformation, followUp: response.choices[0].message.content });
    } catch (error) {
        console.error("❌ Follow-up recall error:", error);
        res.status(500).json({ success: false, error: "Unable to recall candidate context for the follow-up." });
    }
});

// Same candidate and prompt on both sides; only the Hindsight context differs.
app.post("/api/demo-comparison", async (req, res) => {
    try {
        const callNumber = Number(req.body.callNumber);
        if (![1, 2, 3].includes(callNumber)) {
            return res.status(400).json({ success: false, error: "Choose Call 1, Call 2, or Call 3." });
        }

        let rememberedInformation = "";
        if (callNumber > 1) {
            rememberedInformation = await recallCandidateMemory(
                callNumber === 2
                    ? "What career goals, location and work-model preferences, compensation expectations, and work-style constraints did Rashi share that should guide a thoughtful recruiter follow-up?"
                    : "What compensation range did Rashi state she is seeking for backend roles? Retrieve the exact expectation from her recruiter conversations, with related location, work-model, and schedule preferences.",
                callNumber === 2 ? "followUp" : "today"
            );
            if (callNumber === 3 && recalledMemoryCache.followUp) {
                rememberedInformation = [...new Set([
                    ...recalledMemoryCache.followUp.split("\n"),
                    ...rememberedInformation.split("\n")
                ].filter(Boolean))].join("\n");
            }
            if (!rememberedInformation.trim()) {
                return res.status(404).json({ success: false, error: "No candidate memory was found. Use Remember important details first." });
            }
        }

        const question = "Draft a concise recruiter opening to Rashi about the Backend Engineer opportunity. Explain the relevant alignment and ask one useful question to verify. Do not make a hiring decision.";
        const system = "You are a recruiter relationship assistant. Use only the information provided. Reply in at most two short sentences and 35 words. When candidate history is absent, introduce the opportunity neutrally and ask a general interest question; do not claim candidate experience, preferences, or alignment. Do not invent facts or make a hiring decision.";
        const generate = async (withMemory) => {
            const context = withMemory && rememberedInformation
                ? `\n\nRecalled candidate context from Hindsight:\n${rememberedInformation}`
                : "";
            const response = await groq.chat.completions.create({
                model: "openai/gpt-oss-120b",
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: `${question}\n\nCandidate: Rashi Sharma\nOpportunity: Backend Engineer, Hyderabad, ₹14 LPA, hybrid, Node.js, predictable hours.${context}` }
                ]
            });
            return response.choices[0].message.content;
        };

        const [withoutMemory, withMemory] = await Promise.all([generate(false), generate(true)]);
        const memoryFacts = callNumber === 2
            ? recalledFactsCache.followUp
            : callNumber === 3
                ? [...new Set([...recalledFactsCache.followUp, ...recalledFactsCache.today])].slice(0, 4)
                : [];
        res.json({ success: true, callNumber, memory: rememberedInformation, memoryFacts, withoutMemory, withMemory });
    } catch (error) {
        console.error("❌ Memory comparison error:", error);
        res.status(500).json({ success: false, error: "Unable to generate the memory comparison." });
    }
});


// =====================================================
// RECALL CANDIDATE CONTEXT
// =====================================================

app.post("/api/recruiter-brief", async (req, res) => {

    try {

        console.log("🔎 Recalling Rashi's memory...");

        const rememberedInformation = await recallCandidateMemory(
            "What compensation range did Rashi state she is seeking for backend roles? Retrieve the exact expectation from her recruiter conversations, with related location, work-model, and schedule preferences.",
            "today"
        );
        const completeMemory = recalledMemoryCache.followUp
            ? [...new Set([
                ...recalledMemoryCache.followUp.split("\n"),
                ...rememberedInformation.split("\n")
            ].filter(Boolean))].join("\n")
            : rememberedInformation;

        if (!completeMemory.trim()) {
            return res.status(404).json({ success: false, error: "No candidate memory was found. Remember the initial conversation first." });
        }
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
${completeMemory}

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
            memory: completeMemory,
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