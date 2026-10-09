# AI Log

## 1. Tools Used
- **get_loan_schemes()**: Fetched current plans.
- **calculate_quote()**: Called to validate and compute values securely via the backend.
- **submit_application()**: Triggered only after the UI confirmation gate was passed.

## 2. Prompts Used

**Prompt 1 (Backend Validation):**
"Create a set of exact Zod validation schemas for a gold loan intake form. It must validate Indian mobile numbers securely, enforce gross weight >= net weight, and limit karat to 18, 22, or 24."

**Prompt 2 (AI Agent Instructions):**
"You are the AurumFlow AI Gold Loan Assistant. NEVER calculate financial values yourself. You MUST use the calculate_quote tool. Do not invent loan schemes. You cannot submit an application on behalf of the user unless they have explicitly provided all required details and confirmed the application."

## 3. Genuine AI Error Encountered
While testing the Gemini integration using the `@google/genai` SDK, the model attempted to use `gemini-1.5-flash`, but the specific environment returned a `404 Not Found` for API version `v1beta` suggesting the use of `models/gemini-3.8-flash`. After updating to `gemini-3.8-flash`, the model began throwing `503 Service Unavailable (Overloaded)` due to high demand. 
Additionally, during development of the prompt, the model occasionally attempted to pre-calculate the eligible loan before calling `calculate_quote`. This was discovered during evaluation when the returned value was exactly 75% of the gross weight without considering purity.
**Fix/Test:** Added a strict prompt instruction: "NEVER calculate financial values yourself" and an evaluation scenario (`Scenario B`) that ensures the model calls the `calculate_quote` tool instead of providing a fabricated answer. The unit tests also independently verify the calculation service deterministic output.
