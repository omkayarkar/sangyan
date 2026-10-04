from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class RiskLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

class Language(str, Enum):
    EN = "en"
    HI = "hi"

class RedFlagCategory(str, Enum):
    ACTIONABLE_TRADING = "Actionable Trading Instruction"
    GUARANTEED_RETURNS = "Guaranteed Returns"
    URGENCY_FOMO = "Urgency / FOMO"
    UNVERIFIED_REGULATORY_CLAIM = "Unverified Regulatory Claim"
    SUSPICIOUS_CONTACT = "Suspicious Contact / Channel"
    SUSPICIOUS_URL = "Suspicious Link / URL"
    REQUEST_FOR_MONEY = "Request for Money / Payment"
    IMPERSONATION = "Impersonation Indicator"
    UNREALISTIC_FINANCIAL_CLAIM = "Unrealistic Financial Claim"
    CREDENTIAL_ACCOUNT_ACCESS = "Credential / Account Access Request"
    SOCIAL_PROOF_MANIPULATION = "Social Proof / Performance Manipulation"

class RedFlag(BaseModel):
    category: str
    title_en: str
    title_hi: str
    explanation_en: str
    explanation_hi: str
    snippet: Optional[str] = None
    severity: str = "High"  # High, Medium, Low

class ClaimToVerify(BaseModel):
    claim_text: str
    reason_en: str
    reason_hi: str
    verification_source_en: str
    verification_source_hi: str
    official_link: Optional[str] = None

class SafeStep(BaseModel):
    step_en: str
    step_hi: str
    priority: str = "Critical"  # Critical, Recommended

class AnalyzeTextRequest(BaseModel):
    text: str = Field(..., description="Message text received on WhatsApp, Telegram, etc.")
    language: Language = Field(default=Language.EN, description="Preferred language for output (en or hi)")

class AnalysisResponse(BaseModel):
    risk_level: RiskLevel
    risk_score: int = Field(..., ge=0, le=100, description="0-100 AI-assisted risk score")
    risk_score_label: str = Field(
        default="AI-assisted risk assessment score (NOT a probability that the message is a scam)",
        description="Disclaimer label for the score"
    )
    summary_en: str
    summary_hi: str
    red_flags: List[RedFlag]
    claims_to_verify: List[ClaimToVerify]
    safe_next_steps: List[SafeStep]
    analyzed_text_snippet: str
    input_type: str = "text"  # "text" or "screenshot"
    guardrail_notice: str = (
        "SANGYAN is an investor-safety and content-risk analysis tool. "
        "It NEVER provides stock tips, buy/sell/hold recommendations, price predictions, or financial advisory."
    )

class QuickVerifyRequest(BaseModel):
    query: str = Field(..., description="Entity name, domain URL, or SEBI reg number to check")

class QuickVerifyResponse(BaseModel):
    query: str
    is_official_known_domain: bool
    domain_status: str
    guidance_en: str
    guidance_hi: str
    official_portal_link: Optional[str] = None

class DemoCase(BaseModel):
    id: str
    title_en: str
    title_hi: str
    category: str
    sample_text: str
    description_en: str
    description_hi: str

class AssistantChatRequest(BaseModel):
    message: str = Field(..., description="User investor safety or educational query")
    language: Language = Field(default=Language.EN, description="Preferred language (en or hi)")

class AssistantChatResponse(BaseModel):
    answer: str

