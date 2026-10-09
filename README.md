# AurumFlow — AI-Powered Gold Loan Portal

**"Smarter gold lending, powered by AI."**

AurumFlow is a modern, full-stack gold loan intake application built for the TGlobal Junior Full-Stack Developer Internship assignment. It provides a guided, three-step application flow with real-time quote calculation and an integrated AI assistant.

## Features

- **Three-Step Application:** Streamlined flow for capturing customer details, calculating quotes, and submitting applications.
- **Deterministic Server-Side Calculations:** All financial logic (pure gold weight, gold value, eligible loan amount) is calculated securely on the server.
- **AI Loan Assistant:** An integrated Gemini-powered assistant that can calculate quotes and submit applications using server-side tools, enforcing a mandatory UI confirmation safety gate.
- **Duplicate Detection:** Automatic 7-day duplicate application prevention using mobile numbers.
- **Admin Dashboard:** A responsive table view of all incoming leads, complete with mobile masking and scheme filtering.

## Technology Stack

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, React Hook Form, Zod, TanStack Query, React Router, Lucide React.
- **Backend:** Node.js, Express, TypeScript, Zod, Prisma.
- **Database:** PostgreSQL (hosted on Supabase).
- **AI/LLM:** Google Gemini API (`@google/genai` SDK) via server-side tool dispatcher.

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

Ensure you add a valid Supabase PostgreSQL connection string and your Gemini API key.

### 2. Install Dependencies

```bash
npm run install:all
```

### 3. Database Setup (Migrations & Seeding)

Navigate to the `server` directory, configure your database, and run the following:

```bash
cd server
npx prisma migrate deploy
npm run db:seed
```

*(Note: The seed script idempotently creates the two required loan schemes: Bullet Repayment and Monthly EMI).*

### 4. Running the Application

Run both the client and server concurrently from the root directory:

```bash
npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

## Testing & Evaluation

### Unit & Integration Tests

Backend tests are written using Vitest and Supertest. They cover calculation logic (all assignment scenarios) and API endpoints.

```bash
npm run test
```

### AI Evaluation Script

Run the automated 5-scenario evaluation for the Gemini agent:

```bash
npm run eval
```

## Known Limitations & Future Improvements

- **Authentication:** The Admin Dashboard currently lacks authentication. In a production environment, this would be secured via JWTs or session-based auth (e.g. Firebase Auth).
- **Rate Limiting:** Basic rate-limiting on lead submission is not fully implemented but could be added using `express-rate-limit` for DDoS protection.
- **Concurrency:** Basic duplicate protection is implemented inside a transaction, but a strict idempotency key approach could further harden the submission endpoint.

## Optional Bonuses Implemented

- Added a transaction-safe duplicate detection mechanism for concurrent requests.
- Added comprehensive Vitest test coverage for the exact financial scenarios.
