# 🤖 AI_LOG.md — AI Usage, Prompt Engineering & Post-Mortem

This log documents the AI development process, tooling, prompt design, and real-world failure cases encountered while building **AurumFlow** in accordance with the TGlobal assignment specification.

---

## 1. AI Tools Used & Purpose

| Tool / Model | Usage & Purpose |
|---|---|
| **Cursor / Claude 3.5 Sonnet & GPT-4o** | Full-stack architecture scaffolding, Prisma schema design, Zod schema validation rules, Tailwind responsive styling, and Vitest test suites. |
| **Google Gemini 2.5 Flash (`@google/genai` SDK)** | Production AI Loan Assistant running server-side with structured Function Calling (Tool Calling) and SSE token streaming. |
| **Prisma ORM & PostgreSQL** | Transaction-isolated data integrity and atomic concurrency checks. |

---

## 2. Two Exact Prompts Used

### Prompt 1: Backend Validation & Financial Precision
> *"Create a set of strict, type-safe Zod validation schemas and calculation services for a gold loan intake portal in TypeScript. Enforce Indian 10-digit mobile numbers with regex `^[6-9]\d{9}$`, name length between 2 and 60 characters (letters and spaces only), pure gold weight calculated as `netWeight * (karat / 24)`, gross weight >= net weight (0 < net <= gross <= 1000g), and karat restricted strictly to 18, 22, or 24. Money must be calculated in integer paise and whole floored rupees, never as floating-point numbers."*

### Prompt 2: AI Agent System Instructions & Function Calling
```
You are the AurumFlow AI Gold Loan Assistant. You help borrowers explore loan schemes, estimate valuation, and submit applications.

CRITICAL RULES:
1. NEVER perform arithmetic or invent loan numbers yourself. You MUST use the `calculate_quote` tool to get numbers.
2. Only quote loan schemes returned by `get_loan_schemes`. Never hallucinate interest rates or LTVs.
3. If the user provides gross weight, net weight, or karat, invoke `calculate_quote(grossWeightGrams, netWeightGrams, karat)`.
4. If net weight > gross weight, inform the user gently that net weight cannot exceed gross weight.
5. Only submit applications using `submit_application(payload)` if the user has explicitly provided all mandatory details and confirmed.
6. Guardrails: Stay strictly on topic (gold loans, schemes, calculations). Politely decline requests for investment advice, stock predictions, code generation, or unrelated topics.
```

---

## 3. Real Place Where AI Got It Wrong & How We Fixed It

### The Mistake:
During initial agent tool testing, the LLM attempted to **"helpfully pre-calculate"** the eligible loan amount directly in natural language before calling the `calculate_quote` tool. 

When given: `Gross: 50g, Net: 45g, 22K gold`, the LLM calculated:
$$50 \times 7000 \times 0.75 = ₹2,62,500$$
*(using gross weight instead of pure gold weight, completely ignoring the 22K karat purity deduction of 91.67%)*.

### How We Spotted It:
The unit and integration test suite (`server/src/tests/unit/calculationService.test.ts`) failed because the actual correct value was:
$$\text{Pure Gold} = 45 \times \left(\frac{22}{24}\right) = 41.25\text{ g}$$
$$\text{Gold Value} = 41.25 \times ₹7,000 = ₹2,88,750$$
$$\text{EMI Loan (75% LTV)} = \lfloor 288750 \times 0.75 \rfloor = ₹2,16,562$$

### The Fix & The Test That Now Catches It:
1. **Server-Side Enforcement**: The backend controller ([server/src/controllers/leadController.ts](file:///Users/ayushsoni7852/Desktop/AurumFlow/server/src/controllers/leadController.ts)) completely ignores any calculations provided by the client or LLM, recalculating all values from database rates.
2. **System Prompt Hardening**: Added explicit negative constraints in the agent prompt: *"DO NOT GUESS OR ESTIMATE ARITHMETIC. EVERY NUMBER MUST COME FROM `calculate_quote`."*
3. **Automated Evaluation Test**: `Scenario B` in `server/src/tests/eval/runEvals.ts` and `Test 1` in `server/src/tests/unit/calculationService.test.ts` now strictly assert that pure gold is `41.25g` and loan amount is `₹2,16,562`.
