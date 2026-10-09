# 🌟 AurumFlow — Intelligent Gold Loan Origination & Management System

[![Live Frontend](https://img.shields.io/badge/Vercel-Live%20Frontend-black?style=flat&logo=vercel)](https://aurumflow.vercel.app)
[![Backend API](https://img.shields.io/badge/Render-Live%20Backend-46E3B7?style=flat&logo=render)](https://aurumflow-server.onrender.com/health)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green?style=flat&logo=node.js)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Google Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-8E75B2?style=flat&logo=google)](https://ai.google.dev/)

> **"Intelligent, transparent, and instantaneous gold lending powered by deterministic financial engineering and AI streaming."**

AurumFlow is a full-stack financial technology application built for seamless gold loan origination, real-time quote generation, AI-powered conversational assistance, and administrative lead tracking.

---

## 🚀 Key Features

### 1. 📋 Guided 3-Step Loan Origination
- **Step 1: Gold & Applicant Intake** — Validated input for gross weight, net weight, karat purity (18K, 22K, 24K), name, and Indian mobile numbers.
- **Step 2: Instant Valuation & Scheme Selection** — Server-calculated market valuation with side-by-side scheme comparison (Bullet Repayment vs. Monthly EMI).
- **Step 3: Review & Submission** — Transparent terms disclosure, preliminary offer breakdown, and instant application ID generation (`AF-XXXXXX`).

### 2. 🤖 Fast-Streaming AI Loan Assistant
- Powered by **Google Gemini 2.5** via the modern `@google/genai` SDK.
- **Single-Pass Token Streaming (SSE)**: Instant real-time responses with live status indicators and markdown formatting.
- Interactive quick suggestions, scheme comparison, formula breakdown, and guided loan assistance.

### 3. 🔒 Secure Authentication & Authorization
- Secure user registration and login with **bcrypt password hashing** (`bcryptjs`).
- Role-based route protection (`user` vs. `admin`) preserving state on page reloads.
- Demo auto-fill credentials for quick reviewer access.

### 4. 📊 Admin Leads Dashboard
- Search, view, and filter all incoming gold loan applications by scheme.
- Security-compliant customer privacy with automated mobile number masking (`+91 98765XXXX0`).
- Responsive table with horizontal scrolling on mobile viewports.

### 5. 📱 Application Tracking
- Authenticated customer portal to monitor past and active loan applications, LTV, pure gold weights, and approval status.

### 6. 📱 100% Responsive Design
- Tailored for mobile, tablet, and desktop screens with collapsible hamburger drawer navigation, touch-friendly tap targets, and adaptive grids.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, TanStack React Query, React Hook Form, Zod, React Router DOM, Lucide Icons, React Markdown |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM, Bcryptjs, Server-Sent Events (SSE), Zod |
| **Database** | PostgreSQL (Supabase / Render PostgreSQL) |
| **AI / LLM** | Google Gemini 2.5 Flash (`@google/genai` SDK) |
| **Testing** | Vitest, Supertest |
| **Deployment** | Vercel (Frontend SPA) + Render (Backend Web Service) |

---

## 📐 Deterministic Financial Calculations

All financial calculations are strictly executed server-side to prevent client-side tampering:

- **Pure Gold Calculation:**
  $$\text{Pure Gold (g)} = \text{Net Weight (g)} \times \left(\frac{\text{Karat}}{24}\right)$$
- **Gold Valuation:**
  $$\text{Valuation (₹)} = \text{Pure Gold (g)} \times \text{Base 24K Rate (₹/g)}$$
- **Eligible Loan Amount:**
  $$\text{Eligible Loan (₹)} = \text{Valuation (₹)} \times \left(\frac{\text{Max LTV \%}}{100}\right)$$

---

## 🗄️ Database Schema & Schemes

The database is managed via Prisma ORM:

```prisma
model User {
  id           String        @id @default(uuid())
  email        String        @unique
  passwordHash String
  name         String?
  role         String        @default("user") // "user" | "admin"
  createdAt    DateTime      @default(now())
  leads        Lead[]
}

model LoanScheme {
  id                        String   @id // e.g. "PLAN_BULLET_01", "PLAN_EMI_01"
  name                      String
  annualInterestRatePercent Float
  maxLtvPercent             Float
  tenureMonths              Int
  repaymentType             String   // "BULLET" | "MONTHLY_EMI"
  repaymentDescription      String
  leads                     Lead[]
}

model Lead {
  applicationId      String      @id // e.g. "AF-A1B2C3"
  customerName       String
  mobileNumber       String
  maskedMobile       String
  grossWeightGrams   Float
  netWeightGrams     Float
  karat              Int
  pureGoldGrams      Float
  goldValueRupees    Float
  eligibleLoanRupees Float
  selectedPlanId     String
  status             String      @default("SUBMITTED")
  createdAt          DateTime    @default(now())
  userId             String?
}
```

---

## ⚡ Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: v18.x or higher
- **npm** or **yarn**
- **PostgreSQL Database** (Local or Supabase)
- **Google Gemini API Key** ([Google AI Studio](https://aistudio.google.com/))

### 2. Clone the Repository
```bash
git clone https://github.com/Ayushsoni9125/aurumflow.git
cd AurumFlow
```

### 3. Environment Configuration

#### Server Environment (`server/.env`):
```env
PORT=5000
DATABASE_URL="postgresql://user:password@host:5432/aurumflow?sslmode=require"
DIRECT_URL="postgresql://user:password@host:5432/aurumflow?sslmode=require"
GEMINI_API_KEY="your-google-gemini-api-key"
CORS_ORIGIN="http://localhost:3000"
JWT_SECRET="your-secret-key-here"
```

#### Client Environment (`client/.env`):
```env
VITE_API_BASE_URL="http://localhost:5000"
```

### 4. Install Dependencies
```bash
# Install root, client, and server dependencies
npm run install:all
```

### 5. Database Migration & Seeding
```bash
cd server
npx prisma db push
npm run db:seed
cd ..
```

### 6. Run the Development Server
```bash
npm run dev
```
- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:5000`
- **Health Check:** `http://localhost:5000/health`

---

## 🧪 Testing

Run backend unit and integration test suites:

```bash
cd server
npm test
```

Tests validate:
- Accurate pure gold & loan eligibility calculations across 18K, 22K, and 24K purities.
- 7-day duplicate application prevention per mobile number.
- Server validation schema errors on invalid weights and karats.

---

## 🔑 Demo Credentials

For quick evaluation, click the demo buttons on the Sign In page or use:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@aurumflow.com` | `admin` |
| **User** | `user@aurumflow.com` | `user` |

---

## 🌐 Production Deployment

- **Frontend (Vercel)**: Configured with `vercel.json` SPA URL rewrites.
- **Backend (Render)**: Configured with production health check endpoint `/health` and Supabase PostgreSQL connection pool.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
