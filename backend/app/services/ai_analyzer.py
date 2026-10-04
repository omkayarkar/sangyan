import logging
import json
from app.config import settings
from app.models.schemas import AnalysisResponse, RiskLevel
from app.services.risk_engine import RiskEngine

logger = logging.getLogger(__name__)

class AIAnalyzerService:
    """
    AI analyzer using Groq with deterministic RiskEngine backup.
    Ensures zero failure rate and strict investor-safety guardrails.
    """

    GROQ_MODEL = "openai/gpt-oss-120b"

    @classmethod
    async def analyze_content(cls, text: str, requested_lang: str = "en", is_screenshot: bool = False) -> AnalysisResponse:
        # First, run the deterministic risk engine
        base_response = RiskEngine.analyze(text, requested_lang)

        if is_screenshot:
            base_response.input_type = "screenshot"

        # If Groq API key is configured, enrich with AI reasoning
        if settings.GROQ_API_KEY:
            try:
                from groq import Groq

                client = Groq(api_key=settings.GROQ_API_KEY)

                prompt = f"""
You are SANGYAN, an investor-safety AI assistant helping Rahul, a first-time investor from a Tier-3 city in India.
Analyze the following financial message received on WhatsApp/Telegram for fraudulent red flags.

CRITICAL GUARDRAILS:
- NEVER recommend buying, selling, or holding any stock.
- NEVER predict stock prices or give trading signals.
- NEVER promote brokers or financial products.
- DO NOT claim a message is fraudulent unless sufficient evidence.

Message Content:
\"\"\"{text}\"\"\"

Analyze and provide:
1. Risk Level (Low, Medium, High, Critical)
2. Risk Score (0-100)
3. Red Flags list with simple Hindi and English explanations
4. Claims requiring verification
5. Safe next steps

Respond ONLY in valid JSON with schema matching:
{{
  "risk_level": "Critical" | "High" | "Medium" | "Low",
  "risk_score": int,
  "summary_en": "string",
  "summary_hi": "string",
  "red_flags": [
     {{
       "category": "string",
       "title_en": "string",
       "title_hi": "string",
       "explanation_en": "string",
       "explanation_hi": "string",
       "snippet": "string",
       "severity": "High" | "Medium" | "Low"
     }}
  ],
  "claims_to_verify": [
     {{
       "claim_text": "string",
       "reason_en": "string",
       "reason_hi": "string",
       "verification_source_en": "string",
       "verification_source_hi": "string"
     }}
  ]
}}
"""

                response = client.chat.completions.create(
                    model=cls.GROQ_MODEL,
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature=0.2
                )

                ai_text = response.choices[0].message.content

                if ai_text:
                    parsed = json.loads(
                        ai_text.strip()
                        .strip("`")
                        .strip("json")
                    )

                    # Merge AI findings into base_response
                    # without allowing AI to downgrade deterministic score.
                    if "risk_score" in parsed:
                        ai_score = min(100, max(0, int(parsed["risk_score"])))
                        base_response.risk_score = max(
                            base_response.risk_score,
                            ai_score
                        )

                    if base_response.risk_score >= 85:
                        base_response.risk_level = RiskLevel.CRITICAL
                    elif base_response.risk_score >= 60:
                        base_response.risk_level = RiskLevel.HIGH
                    elif base_response.risk_score >= 25:
                        base_response.risk_level = RiskLevel.MEDIUM
                    else:
                        base_response.risk_level = RiskLevel.LOW

                    if parsed.get("summary_en"):
                        base_response.summary_en = parsed["summary_en"]

                    if parsed.get("summary_hi"):
                        base_response.summary_hi = parsed["summary_hi"]

            except Exception as e:
                logger.warning(f"Groq API enrichment failed or fallback used: {e}")

        return base_response

    @classmethod
    async def ask_assistant(cls, message: str, requested_lang: str = "en") -> str:
        fallback_answer_en = (
            "I am SANGYAN Assistant, here to help with investor safety, scam awareness, and education. "
            "Always verify financial entities on the official SEBI portal (sebi.gov.in) or SCORES. "
            "Never share passwords, OTPs, or transfer money to unverified individuals or Telegram groups."
        )

        fallback_answer_hi = (
            "मैं संज्ञान असिस्टेंट हूँ, जो निवेशक सुरक्षा और जागरूकता में आपकी सहायता करता है। "
            "हमेशा आधिकारिक SEBI पोर्टल (sebi.gov.in) या SCORES पर वित्तीय संस्थाओं की पुष्टि करें। "
            "कभी भी पासवर्ड, OTP साझा न करें और अज्ञात व्यक्तियों या Telegram समूहों को पैसे न भेजें।"
        )

        default_fallback = (
            fallback_answer_hi
            if requested_lang == "hi"
            else fallback_answer_en
        )

        if settings.GROQ_API_KEY:
            try:
                from groq import Groq

                client = Groq(api_key=settings.GROQ_API_KEY)

                prompt = f"""
You are SANGYAN Assistant, an AI guide dedicated strictly to investor safety, scam awareness, regulatory verification (SEBI/RBI/SCORES), and general investor education in India.

Requested Output Language: {requested_lang} ('hi' for Hindi, 'en' for English).

ASSISTANT SCOPE:
- Investor safety and scam awareness.
- Explaining financial concepts such as SIP, mutual funds, KYC, nominee, volatility, and SEBI roles.
- Guidance on verifying registered entity numbers, official URLs, and reporting fraud.
- Safe next steps when receiving suspicious messages.

STRICT NEGATIVE CONSTRAINTS:
1. NEVER recommend buying, selling, or holding any specific stock, bond, or security.
2. NEVER give stock tips, price targets, or market predictions.
3. NEVER promote specific brokers, trading platforms, or financial products.
4. NEVER request OTPs, passwords, PINs, or bank account credentials.
5. NEVER encourage money transfers or payments.

User Question:
\"\"\"{message}\"\"\"

Provide a helpful, educational response in the requested language ({requested_lang}) adhering strictly to the above scope and negative constraints.
"""

                response = client.chat.completions.create(
                    model=cls.GROQ_MODEL,
                    messages=[
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    temperature=0.2
                )

                answer = response.choices[0].message.content

                if answer:
                    return answer.strip()

            except Exception as e:
                logger.warning(f"Groq assistant call failed: {e}")

        return default_fallback
