from typing import List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.models.schemas import (
    AnalyzeTextRequest, 
    AnalysisResponse, 
    QuickVerifyRequest, 
    QuickVerifyResponse, 
    DemoCase,
    Language,
    AssistantChatRequest,
    AssistantChatResponse
)
from app.services.ai_analyzer import AIAnalyzerService
from app.services.ocr import OCRService
from app.services.verifier import VerifierService

router = APIRouter(prefix="/api", tags=["Analysis & Safety"])

DEMO_CASES: List[DemoCase] = [
    DemoCase(
        id="demo_whatsapp_guaranteed",
        title_en="WhatsApp Guaranteed 100% Return Scam",
        title_hi="व्हाट्सएप 100% गारंटीड रिटर्न स्कैम",
        category="Guaranteed Return Scam",
        sample_text="🔥 EXCLUSIVE VIP INVESTMENT GROUP 🔥\nEarn Guaranteed 100% profit in 7 days! No risk, 100% safe. We are SEBI approved officers. Send ₹5,000 via UPI now to activate your daily payout. Hurry, only 5 seats left! Join: bit.ly/vip-jackpot-tips",
        description_en="Typical WhatsApp message claiming 100% guaranteed returns, SEBI approval, urgent 5 seats left, and asking for upfront UPI money.",
        description_hi="व्हाट्सएप पर आया फर्जी मैसेज जो 100% गारंटीड रिटर्न, नकली SEBI अप्रूवल और UPI पर पैसे भेजने की मांग करता है।"
    ),
    DemoCase(
        id="demo_telegram_insider",
        title_en="Telegram Crypto & Stock Jackpot Tips",
        title_hi="टेलीग्राम क्रिप्टो एवं स्टॉक जैकपॉट टिप्स",
        category="Pump & Dump / Tips Group",
        sample_text="🚀 MULTIBAGGER STOCK ALERT 🚀\nTurn ₹10,000 into ₹1,500,000 overnight! Buy shares of ABC Corp immediately before news breaks! Join private Telegram admin channel t.me/insidertips for daily jackpot calls. Guaranteed profits guaranteed by RBI licensed NBFC.",
        description_en="Telegram channel promoting overnight riches, insider jackpot tips, and fake RBI licensed NBFC claims.",
        description_hi="टेलीग्राम चैनल का झांसा जो रातों-रात 10 हजार के 15 लाख बनाने का फर्जी दावा करता है।"
    ),
    DemoCase(
        id="demo_fake_sebi_officer",
        title_en="Impersonation of SEBI / Broker Official",
        title_hi="SEBI अधिकारी और Zerodha का झूठा प्रतिरूपण",
        category="Impersonation",
        sample_text="Hello, I am Mr. Sharma, Senior SEBI Officer and Zerodha VIP Regional Manager. Your account requires immediate verification. Transfer ₹2,500 registration fee to UPI ID sebi.official@upi to prevent freezing of your trading account.",
        description_en="Fraudster impersonating SEBI & Zerodha official demanding ₹2,500 registration fee under threat of account freezing.",
        description_hi="खुद को SEBI और Zerodha अधिकारी बताकर अकाउंट फ्रीज करने की धमकी देकर पैसे ऐंठने की कोशिश।"
    ),
    DemoCase(
        id="demo_legitimate_mf_update",
        title_en="Legitimate Bank / Mutual Fund Information",
        title_hi="असली बैंक / म्यूचुअल फंड मैसेज",
        category="Legitimate Informational Message",
        sample_text="Dear Investor, your monthly SIP of ₹1,000 for Tata Digital India Fund has been successfully processed on 03-Oct-2026. NAV: 42.15. Mutual funds are subject to market risks. Read all scheme related documents carefully before investing. Visit tatamutualfund.com for details.",
        description_en="Genuine educational/informational mutual fund statement with standard risk disclaimer and official domain link.",
        description_hi="आधिकारिक म्यूचुअल फंड का सही मैसेज जिसमें मार्केट रिस्क डिस्क्लेमर और सही tatamutualfund.com लिंक है।"
    )
]

@router.post("/analyze/text", response_model=AnalysisResponse)
async def analyze_text(request: AnalyzeTextRequest):
    """
    Analyzes pasted financial message text for risk indicators, red flags, claims, and safe next steps.
    """
    if not request.text or not request.text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message text cannot be empty."
        )

    response = await AIAnalyzerService.analyze_content(
        text=request.text, 
        requested_lang=request.language.value,
        is_screenshot=False
    )
    return response

@router.post("/analyze/image", response_model=AnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    language: str = Form("en")
):
    """
    Upload screenshot image (WhatsApp, Telegram, SMS), performs OCR text extraction, and returns complete risk analysis.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a valid image (PNG, JPG, JPEG, WEBP)."
        )

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image size exceeds 10MB limit."
        )

    # Perform OCR
    extracted_text = OCRService.extract_text_from_bytes(contents)

    # Analyze extracted content
    response = await AIAnalyzerService.analyze_content(
        text=extracted_text,
        requested_lang=language,
        is_screenshot=True
    )
    return response

@router.get("/demo-cases", response_model=List[DemoCase])
def get_demo_cases():
    """
    Returns realistic sample WhatsApp/Telegram financial messages for instant testing.
    """
    return DEMO_CASES

@router.post("/verify-claim", response_model=QuickVerifyResponse)
def verify_claim(request: QuickVerifyRequest):
    """
    Interactive lookup tool to verify domains, links, and SEBI registration string validity.
    """
    if not request.query or not request.query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query string cannot be empty."
        )
    return VerifierService.verify_query(request.query)

@router.post("/assistant/chat", response_model=AssistantChatResponse)
async def assistant_chat(request: AssistantChatRequest):
    """
    General AI assistant for investor safety, scam awareness, and education questions.
    """
    if not request.message or not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty."
        )
    answer = await AIAnalyzerService.ask_assistant(
        message=request.message,
        requested_lang=request.language.value
    )
    return AssistantChatResponse(answer=answer)

