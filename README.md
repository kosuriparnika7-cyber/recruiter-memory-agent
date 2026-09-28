# Recall — Recruiter Memory Agent

Recall demonstrates how a recruiter can carry useful candidate preferences from one conversation into a later opportunity discussion. The app extracts candidate context, stores it in Hindsight, and uses recalled details to draft a follow-up and recruiter brief.

## Run locally

1. Install dependencies with `npm install`.
2. Add `HINDSIGHT_API_KEY` and `GROQ_API_KEY` to a local `.env` file.
3. Start the app with `npm start` and open `http://localhost:3000`.
4. Select **Remember important details**, explore the Call 1–3 comparison, then generate the recruiter brief.

## How Hindsight memory is used

When **Remember important details** is selected, Groq extracts durable preferences from Rashi’s initial recruiter conversation. The backend creates the `recall-demo-v2` bank if needed, then calls `retain()` once for the stable conversation ID. A local record, stable Hindsight document ID, and asynchronous operation ID prevent repeated submissions and retries from retaining the same demo conversation again.

For later interactions, the backend calls `recall()` with a question matched to the stage: a personalized follow-up, a compensation-focused opportunity comparison, or the recruiter brief. Recalled facts are normalized, deduplicated, and limited to a short list before display and use in the generated response. Call 1 skips `recall()` to show the no-memory baseline.

## Privacy note

This demo sends the fixed sample conversation and its extracted candidate preferences to Groq and Hindsight. Use synthetic data for demonstrations; do not enter real candidate information without appropriate notice and consent.
