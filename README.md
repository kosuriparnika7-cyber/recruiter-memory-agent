# Recall — Recruiter Candidate Memory Agent

> Your ATS remembers candidates. Recall remembers the relationship.

Recall is an AI-powered recruiter memory agent that helps recruiters retain and retrieve important context about candidates across conversations.

Recruiters often speak with candidates multiple times, but important details such as career goals, compensation expectations, location preferences, work-style priorities, and previous conversations can easily get lost.

Recall uses **Hindsight** as its long-term memory layer to retain these details and bring them back when the recruiter needs them.

## The Problem

Traditional recruiting systems store resumes and application data, but they often fail to preserve the context built through recruiter-candidate conversations.

A recruiter may have already learned:

- What type of role a candidate wants
- Their preferred location and work model
- Compensation expectations
- Career goals
- Working-style preferences
- Details discussed in previous conversations

Without persistent memory, this context has to be rediscovered repeatedly.

## How Recall Works

Recall combines an LLM with Hindsight to create persistent candidate memory.

```text
Recruiter Conversation
        ↓
      LLM
        ↓
Extract important candidate facts
        ↓
     Hindsight
        ↓
Long-term candidate memory
        ↓
New recruiter query
        ↓
     Hindsight
        ↓
Relevant memories recalled
        ↓
      LLM
        ↓
Context-aware recruiter brief
```
## Hindsight Integration
Hindsight is used as the long-term memory layer.
Important candidate information is retained using Hindsight and later recalled when a recruiter asks about the candidate in a new context.
This allows Recall to demonstrate a difference between:
Without memory
- The agent only sees the current interaction.
- Responses are generic.
- Previous candidate preferences are unavailable.
With Hindsight
- Relevant previous information is recalled.
- The response can use the candidate's existing preferences and history.
- Recruiters spend less time re-discovering information.
Example
A candidate previously shared:
- Backend engineering is their preferred direction
- Node.js is an important skill
- Hyderabad is their preferred location
- Hybrid work is preferred
- Expected compensation is around ₹13–15 LPA
- Reasonable working hours are important
When a new Backend Engineer opportunity appears, Recall can retrieve this context and provide the recruiter with a concise brief.
The system surfaces evidence and context. The recruiter remains responsible for the hiring decision.
Tech Stack
- JavaScript / Node.js
- Express
- Groq
- Hindsight
- HTML / CSS / JavaScript
## Project Structure
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
Running Locally
Install dependencies:
npm install
Create a .env file:
HINDSIGHT_API_KEY=your_hindsight_api_key
GROQ_API_KEY=your_groq_api_key
Start the application:
node server.js
Then open:
http://localhost:3000
Why Hindsight?
The important part of Recall is not simply storing candidate information.
The goal is to allow the agent to remember useful context across interactions and use that context when the recruiter encounters the candidate again.
Hindsight provides the memory layer that makes this possible.
Links
- Hindsight GitHub
- Hindsight Documentation
- Vectorize — Agent Memory
Status
Built as a working prototype demonstrating persistent recruiter-candidate memory using Hindsight.
