# Recall — Recruiter Candidate Memory Agent

> Your ATS remembers candidates. Recall remembers the relationship.

Recall is a recruiter memory agent that carries useful candidate context across conversations. It extracts career goals, compensation expectations, location and work model preferences, and work style priorities, then uses that context to inform a later recruiter interaction.

## The problem

Recruiters may speak with the same candidate several times. Without persistent memory, they have to rediscover preferences and constraints that the candidate already shared. Recall demonstrates how an agent can bring that context into a new opportunity discussion while leaving hiring decisions to the recruiter.

## How it works

1. Groq extracts durable preferences from the sample recruiter conversation.
2. Hindsight stores those facts in the `recall-demo-v2` bank.
3. Later requests use `recall()` to retrieve context for a follow-up, a call comparison, or a recruiter brief.
4. Groq drafts a concise response grounded in the recalled information.

## How Hindsight memory is used

When **Remember important details** is selected, the backend creates the `recall-demo-v2` bank if needed and calls `retain()` for the initial conversation. A stable conversation ID, Hindsight document ID, async operation ID, and local success record prevent repeated submissions from retaining the same demo conversation again.

For later interactions, the backend calls `recall()` with a question matched to the stage: a personalized follow-up, the Call 2/3 comparison, or the recruiter brief. Returned facts are normalized, deduplicated by topic, and capped at a short list before they are displayed and used in the generated response. Call 1 skips `recall()` to provide the no-memory baseline.

## Run locally

1. Install dependencies with `npm install`.
2. Add `HINDSIGHT_API_KEY` and `GROQ_API_KEY` to a local `.env` file.
3. Start the app with `npm start` and open `http://localhost:3000`.
4. Select **Remember important details**, compare Calls 1–3, then generate the recruiter brief.

## Tech stack

- JavaScript and Node.js
- Express
- Groq
- Hindsight
- HTML and CSS

## Privacy

This demo sends its fixed sample conversation and extracted preferences to Groq and Hindsight. Use synthetic data for demonstrations; do not enter real candidate information without appropriate notice and consent.

## Project structure

```text
recruiter-memory-agent/
├── public/
├── agent.js
├── call1.js
├── call2.js
├── package.json
├── recruiter-query.js
├── remember.js
├── seed-memory.js
├── server.js
├── smart-memory.js
└── test-groq.js
```
