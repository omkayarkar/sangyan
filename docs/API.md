# SANGYAN API Specification

## Base URL
`http://localhost:8000/api`

---

## Endpoints

### 1. Analyze Text Message
`POST /analyze/text`

**Request Body:**
```json
{
  "text": "Earn Guaranteed 100% profit in 7 days! SEBI approved officers. Send ₹5,000 via UPI.",
  "language": "en"
}
```

**Response (200 OK):**
```json
{
  "risk_level": "High",
  "risk_score": 85,
  "risk_score_label": "AI-assisted risk assessment score (NOT a probability that the message is a scam)",
  "summary_en": "HIGH RISK (Score: 85/100): We detected 3 severe red flags in this message...",
  "summary_hi": "उच्च जोखिम (स्कोर: 85/100): इस मैसेज में 3 बड़े खतरे के निशान मिले हैं...",
  "red_flags": [
    {
      "category": "Guaranteed Returns",
      "title_en": "Promising Guaranteed or Risk-Free Returns",
      "title_hi": "गारंटीड या बिना रिस्क के रिटर्न का वादा",
      "explanation_en": "This message promises guaranteed or risk-free profits...",
      "explanation_hi": "यह मैसेज पक्के या बिना रिस्क के मुनाफे का वादा करता है...",
      "snippet": "Guaranteed 100% profit",
      "severity": "High"
    }
  ],
  "claims_to_verify": [
    {
      "claim_text": "Claimed SEBI Registration / Approval",
      "reason_en": "The message claims association with SEBI...",
      "reason_hi": "मैसेज में SEBI का जिक्र है...",
      "verification_source_en": "Verify directly on SEBI Intermediary Portal (sebi.gov.in)",
      "verification_source_hi": "SEBI की आधिकारिक वेबसाइट (sebi.gov.in) पर जांचें",
      "official_link": "https://www.sebi.gov.in"
    }
  ],
  "safe_next_steps": [
    {
      "step_en": "Do NOT send money or transfer funds via UPI, bank transfer, or crypto.",
      "step_hi": "UPI या बैंक ट्रांसफर के जरिए कोई पैसा न भेजें।",
      "priority": "Critical"
    }
  ],
  "guardrail_notice": "SANGYAN is an investor-safety and content-risk analysis tool. It NEVER provides stock tips, buy/sell recommendations..."
}
```

---

### 2. Analyze Screenshot Image
`POST /analyze/image`

**Form Data:**
- `file`: Image file (PNG, JPG, WEBP)
- `language`: `en` or `hi`

---

### 3. Quick Verify Claim / Domain
`POST /verify-claim`

**Request Body:**
```json
{
  "query": "sebi.gov.in"
}
```

---

### 4. Fetch Sample Demo Cases
`GET /demo-cases`
