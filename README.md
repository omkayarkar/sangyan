# SANGYAN (संज्ञान) — Investor-Safety & Content-Risk Analysis Tool

> **Empowering First-Time Investors from Tier-3 Indian Cities Against Fraudulent Investment Messages**

![SANGYAN Risk Assessment Tool](https://img.shields.io/badge/Status-MVP_Ready-brightgreen)
![Bilingual](https://img.shields.io/badge/Languages-English%20%7C%20Hindi-orange)
![Privacy](https://img.shields.io/badge/Privacy-100%25_Client_In--Memory-blue)

---

## 🎯 Target Persona: Rahul
- **Profile:** 24-year-old first-time investor from Tier-3 India.
- **Channels:** Active on WhatsApp, Telegram, YouTube.
- **Challenge:** Receives unsolicited investment messages promising "guaranteed returns", "SEBI approval", or "insider stock tips" via private chat groups.
- **Need:** Simple, clear, high-contrast, bilingual (Hindi & English) analysis of suspicious messages with actionable safe next steps.

---

## 🚀 Core Features

### 1. Dual Input Support
- **Paste Text:** Direct text input for messages received on WhatsApp, Telegram, or SMS.
- **Upload Screenshot / Image:** Image upload with integrated OCR text extraction for message screenshots.

### 2. Standardized Output Structure
1. **Risk Level:** `Low`, `Medium`, or `High` with intuitive color coding.
2. **Risk Score (0–100):** Clearly labeled as an **AI-assisted risk assessment score**, *NOT* a probability that the message is a scam.
3. **Red Flags & Simple Explanations:**
   - Guaranteed / Assured Returns
   - Urgency & FOMO (Fear Of Missing Out)
   - Unverified SEBI / RBI Regulatory Claims
   - Upfront Money / UPI Transfer Requests
   - Impersonation of Trusted Financial Institutions
   - Unverified Private Group Invitations
   - Suspicious Shortened Links
4. **Claims Requiring Verification:** Explicit instructions on how to verify SEBI numbers or domain links on official portals (`sebi.gov.in`, `sachet.rbi.org.in`).
5. **Safe Next Steps Checklist:** Practical advice (e.g., Do NOT send money, Do NOT share OTPs, Report to CyberCrime 1930).
6. **Bilingual Support:** Seamless instant toggle between English and **हिंदी (Hindi)**.
7. **Voice Output (Text-to-Speech):** One-click audio playback in Hindi & English for accessibility.

---

## 🛡️ Guardrails & Product Boundaries
SANGYAN strictly acts as an **investor-safety and content-risk analysis tool**, *never* an investment advisor:
- ❌ NEVER recommends buying, selling, or holding stocks.
- ❌ NEVER predicts stock prices or provides trading signals.
- ❌ NEVER promotes brokers or financial products.
- ❌ NEVER asks for OTPs, passwords, or bank credentials.

---

## 🛠️ Architecture

```
sangyan/
├── backend/                  # FastAPI Python Backend
│   ├── app/
│   │   ├── api/              # REST Endpoints (/analyze, /verify-claim, /demo-cases)
│   │   ├── services/         # Risk Engine, OCR Service, Verifier Service, AI Analyzer
│   │   ├── models/           # Pydantic v2 Data Schemas
│   │   └── config.py         # Application settings
│   └── tests/                # Pytest Test Suite
│
├── frontend/                 # Next.js 14 + Tailwind CSS + Lucide Icons
│   ├── src/
│   │   ├── app/              # Next.js App Router
│   │   ├── components/       # Accessible UI Components (Header, InputSection, ResultCard)
│   │   ├── lib/              # i18n Dictionary & API Client
│   │   └── types/            # TypeScript Interfaces
│
└── docs/                     # Documentation (Architecture, API, Security, Demo)
```

---

## 🏁 Quick Start

### Backend Setup
```bash
cd backend
python -m pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Running Backend Tests
```bash
cd backend
pytest
```

---

## 📜 License
MIT License. Built for Investor Protection & Hackathon Evaluation.
