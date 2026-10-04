import re
from typing import List, Dict, Any, Tuple, Optional
from app.models.schemas import RiskLevel, RedFlag, ClaimToVerify, SafeStep, AnalysisResponse

class RiskEngine:
    """
    SANGYAN Investor-Safety Risk Engine V2
    Evaluates financial content for actionable trading calls, social media tip groups,
    guaranteed returns, payment fraud, credential theft, unverified regulatory claims,
    and suspicious URLs based on Indian securities market scam patterns.
    """

    OFFICIAL_DOMAINS = {
        "sebi.gov.in", "rbi.org.in", "sachet.rbi.org.in", "nseindia.com", "bseindia.com",
        "amfiindia.com", "tatamutualfund.com", "zerodha.com", "groww.in", "angelone.in",
        "upstox.com", "icicidirect.com", "hdfcbank.com", "sbi.co.in", "cybercrime.gov.in"
    }

    SHORTENER_DOMAINS = {"bit.ly", "tinyurl.com", "t.me", "wa.me", "is.gd", "cutt.ly", "rb.gy", "goo.gl"}
    SUSPICIOUS_TLDS = {".xyz", ".top", ".tk", ".club", ".online", ".site", ".live", ".vip", ".work", ".info", ".biz", ".icu"}

    @classmethod
    def analyze(cls, text: str, requested_lang: str = "en") -> AnalysisResponse:
        """
        Analyzes financial message text for risk indicators, red flags, claims, and safe next steps.
        """
        cleaned_text = text.strip()
        lower_text = cleaned_text.lower()

        # Internal risk dimensions
        content_risk_score = 0
        fraud_signal_score = 0

        found_red_flags: List[RedFlag] = []
        signals: Dict[str, bool] = {}

        # Check if transaction confirmation/educational statement
        is_txn_confirmation = bool(re.search(r"\b(processed|credited|debited|statement|successfully\s+processed|sip\s+of)\b", lower_text))

        # ---------------------------------------------------------------------
        # 1. ACTIONABLE TRADING DETECTION
        # ---------------------------------------------------------------------
        has_action = bool(re.search(
            r"\b(buy|sell|short|long|enter|exit|accumulate|book\s+profit|hold|average|add\s+position|square\s+off|sure-shot|sure\s*shot|jackpot|multibagger|खरीदें|बेचें|बुक\s*मुनाफा)\b",
            lower_text
        ))

        has_instrument = bool(re.search(
            r"\b(nifty|bank\s*nifty|finnifty|sensex|options?|futures?|\bce\b|\bpe\b|call\s+option|put\s+option|intraday|expiry|weekly\s+expiry|index|stock|equity|stroke)\b",
            lower_text
        ))

        has_target_or_price = bool(re.search(
            r"\b(target|target\s+price|\btgt\b|\btp\b|entry|entry\s+price|resistance|support|breakout|breakdown|around\s+\d+|above\s+\d+|below\s+\d+|low\s+\d+)\b",
            lower_text
        ))

        has_stop_loss = bool(re.search(
            r"\b(sl|stop\s*loss|stoploss)\b",
            lower_text
        ))

        has_numerical_levels = bool(re.search(r"\b\d{4,6}\b", lower_text))

        # Educational / Informational Filter Check
        is_educational_sl = bool(re.search(r"\b(learn|how|explanation|what\s+is|guide|understand)\b.*(stop\s*loss|\bsl\b)", lower_text))
        is_market_report = bool(re.search(r"\b(closed\s+at|closed\s+higher|closed\s+lower|market\s+update|market\s+closed|today'?s\s+nifty)\b", lower_text)) and not has_action

        is_actionable_trading = False
        if not is_educational_sl and not is_market_report:
            if (has_action and (has_instrument or has_target_or_price or has_stop_loss or has_numerical_levels)) or \
               (has_instrument and (has_target_or_price or has_stop_loss)) or \
               (has_instrument and has_numerical_levels and (has_target_or_price or has_stop_loss or has_action)):
                is_actionable_trading = True

        if is_actionable_trading:
            signals["ACTIONABLE_TRADING"] = True
            content_risk_score += 20
            if has_target_or_price:
                signals["TARGET_OR_PRICE_LEVEL"] = True
                content_risk_score += 10
            if has_stop_loss:
                signals["STOP_LOSS"] = True
                content_risk_score += 10
            if re.search(r"\b(options?|\bce\b|\bpe\b|futures?|call\s+option|put\s+option)\b", lower_text):
                signals["DERIVATIVE_OPTIONS"] = True
                content_risk_score += 10
            if re.search(r"\b(now|today|live|real-time|real\s+time|current\s+position|अभी|लाइव)\b", lower_text):
                signals["LIVE_REAL_TIME"] = True
                content_risk_score += 10

            matched_snippets = []
            for pat in [r"\b(buy|sell|short|long|nifty|bank\s*nifty|target\s*\d*|\bsl\s*\d*|options?)\b"]:
                m = re.findall(pat, lower_text)
                if m:
                    matched_snippets.extend(m[:3])

            found_red_flags.append(
                RedFlag(
                    category="Actionable Trading Instruction",
                    title_en="Actionable Securities Trading Instruction Detected",
                    title_hi="ट्रेडिंग एक्शन एवं प्राइस लेवल संबंधी निर्देश मिला",
                    explanation_en=(
                        "WHAT: The message gives a specific trading action and/or price level (target, stop-loss, entry/exit).\n"
                        "WHY: This is actionable securities-market advice. The sender and accuracy of the call have not been independently verified.\n"
                        "DO: Do not act solely on this message. SANGYAN does not endorse trading calls. Verify the source independently."
                    ),
                    explanation_hi=(
                        "क्या: इस मैसेज में खास शेयर या इंडेक्स पर ट्रेडिंग एक्शन, टारगेट प्राइस या स्टॉप-लॉस दिया गया है।\n"
                        "क्यों: यह बाजार सलाह है जिसकी प्रामाणिकता साबित नहीं है।\n"
                        "क्या करें: केवल इस मैसेज के आधार पर ट्रेडिंग न करें। खुद स्वतंत्र रूप से जांच करें।"
                    ),
                    snippet=", ".join(set(matched_snippets)) if matched_snippets else "Trading call instruction",
                    severity="Medium"
                )
            )

        # ---------------------------------------------------------------------
        # 2. SOCIAL MEDIA & UNSOLICITED TIP CONTEXT
        # ---------------------------------------------------------------------
        has_social_tip = bool(re.search(
            r"\b(telegram|whatsapp|vip\s+group|vip\s+channel|premium\s+calls|paid\s+calls|insider\s+group|operator\s+group|stock\s+market\s+guru|expert\s+trader|live\s+trading|live\s+call|signal\s+group|sure-shot|sure\s*shot|jackpot\s+call|intraday\s+calls|premium\s+tips|paid\s+tips|वीआईपी|व्हाट्सएप\s*ग्रुप|टेलीग्राम\s*चैनल)\b",
            lower_text
        ))
        if has_social_tip:
            signals["UNSOLICITED_TIP_CONTEXT"] = True
            content_risk_score += 10
            found_red_flags.append(
                RedFlag(
                    category="Suspicious Contact / Channel",
                    title_en="Unsolicited Social-Media Tips Channel",
                    title_hi="अनाधिकृत सोशल मीडिया टिप्स ग्रुप / चैनल",
                    explanation_en=(
                        "WHAT: The message originates from or promotes a Telegram/WhatsApp VIP group, signal channel, or tip service.\n"
                        "WHY: Fraudsters frequently operate unregistered advisory groups promising insider or jackpot calls.\n"
                        "DO: Ensure any investment advisor is SEBI registered before acting on social media tips."
                    ),
                    explanation_hi=(
                        "क्या: मैसेज व्हाट्सएप/टेलीग्राम VIP ग्रुप या टिप्स देने वाले चैनल से जुड़ा है।\n"
                        "क्यों: जालसाज बिना रजिस्ट्रेशन के गुप्त ग्रुप बनाकर फर्जी लालच देते हैं।\n"
                        "क्या करें: सोशल मीडिया के किसी भी मैसेज पर भरोसा करने से पहले सलाहकार का सेबी रजिस्ट्रेशन चेक करें।"
                    ),
                    snippet="VIP / Telegram / WhatsApp Tip Context",
                    severity="Medium"
                )
            )

        # ---------------------------------------------------------------------
        # 3. GUARANTEED / RISK-FREE RETURNS & UNREALISTIC CLAIMS
        # ---------------------------------------------------------------------
        has_disclaimer_negation = bool(re.search(
            r"\b(not\s+guaranteed|no\s+guarantee|returns?\s+(are\s+)?not\s+guaranteed|cannot\s+be\s+guaranteed|subject\s+to\s+market\s+risk)\b",
            lower_text
        ))

        has_guaranteed_return_claim = bool(re.search(
            r"(guarant?ee[d]?|assured\s+returns?|assured\s+profit|100%\s+profit|100%\s+sure|fixed\s+monthly|fixed\s+daily|double\s+(your\s+)?money|10x\s+return|fixed\s+profit|sure\s*profit|2x\s+guaranteed|2x\b|3x\b|5x\b|10x\b|पैसा\s*डबल|गारंटीड|पक्का\s*लाभ|100%\s*मुनाफा|फिक्स्ड\s*रिटर्न|कोई\s*नुकसान\s*नहीं)",
            lower_text
        ))

        has_risk_free_claim = bool(re.search(
            r"(risk\s*free|zero\s*risk|100%\s+safe|no\s*loss|बिना\s*किसी\s*रिस्क)",
            lower_text
        ))

        if (has_guaranteed_return_claim or has_risk_free_claim) and not has_disclaimer_negation:
            signals["GUARANTEED_RETURN"] = True
            fraud_signal_score += 30
            if has_risk_free_claim:
                signals["RISK_FREE_CLAIM"] = True
                fraud_signal_score += 30

            found_red_flags.append(
                RedFlag(
                    category="Guaranteed Returns",
                    title_en="Promising Guaranteed or Risk-Free Profit",
                    title_hi="गारंटीड या बिना रिस्क के रिटर्न का वादा",
                    explanation_en=(
                        "WHAT: The message promises guaranteed, assured, or risk-free financial returns.\n"
                        "WHY: Legitimate securities and market investments carry inherent risk. Indian regulations strictly prohibit guaranteed profit promises.\n"
                        "DO: Treat any guaranteed return claim in market-linked investments as a severe warning sign."
                    ),
                    explanation_hi=(
                        "क्या: मैसेज में पक्के रिटर्न या बिना किसी रिस्क के मुनाफे का वादा किया गया है।\n"
                        "क्यों: शेयर बाजार और म्यूचुअल फंड में रिस्क होता है। नियम के मुताबिक कोई 100% पक्का रिटर्न का वादा नहीं कर सकता।\n"
                        "क्या करें: पक्के मुनाफे के दावों से दूर रहें और पैसे न लगाएं।"
                    ),
                    snippet="Guaranteed return / Risk-free claim",
                    severity="High"
                )
            )

        # ---------------------------------------------------------------------
        # 4. PAYMENT / MONEY REQUESTS
        # ---------------------------------------------------------------------
        has_payment_req = bool(re.search(
            r"\b(upi|qr\s*code|send\s+money|pay\s+registration|deposit\s+amount|joining\s+fee|processing\s+fee|activation\s+fee|verification\s+fee|tax\s+payment|security\s+deposit|withdrawal\s+fee|pay\s+now|pay\s+via|transfer\s+via|send\s+₹?\d+|pay\s+₹?\d+|pay\s+via\s+upi|monthly|यूपीआई|क्यूआर|रजिस्ट्रेशन\s*फीस|पैसे\s*भेजें|फीस\s*जमा|अकाउंट\s*में\s*ट्रांसफर)\b",
            lower_text
        )) and not is_txn_confirmation

        if has_payment_req:
            signals["PAYMENT_REQUEST"] = True
            fraud_signal_score += 25
            found_red_flags.append(
                RedFlag(
                    category="Request for Money / Payment",
                    title_en="Direct Request for Upfront Money or Fees",
                    title_hi="शुरुआती फीस या पैसे ट्रांसफर की मांग",
                    explanation_en=(
                        "WHAT: The message requests money via UPI, registration fees, activation charges, or subscription amounts.\n"
                        "WHY: Scammers often demand upfront fees before giving access to profits, groups, or withdrawals.\n"
                        "DO: Do NOT transfer money to unknown UPI handles or personal accounts."
                    ),
                    explanation_hi=(
                        "क्या: यह मैसेज UPI या बैंक द्वारा फीस/डिपॉजिट पैसे भेजने की मांग कर रहा है।\n"
                        "क्यों: ठग अक्सर किसी काम या मुनाफे के बहाने पहले पैसे ऐंठते हैं।\n"
                        "क्या करें: किसी भी अनजान UPI ID या व्यक्तिगत खाते पर पैसे न भेजें।"
                    ),
                    snippet="Payment / UPI / Fee Request",
                    severity="High"
                )
            )

        # ---------------------------------------------------------------------
        # 5. CREDENTIAL & ACCOUNT HANDLING
        # ---------------------------------------------------------------------
        has_credential = bool(re.search(
            r"\b(share\s+(trading\s+)?password|share\s+login|send\s+otp|send\s+pin|give\s+account\s+access|client\s+id|api\s+key|broker\s+credentials|install\s+remote-access|otp|password|pin)\b",
            lower_text
        )) and bool(re.search(r"\b(send|share|give|provide|bhejo|bhej|login|otp)\b", lower_text))

        has_account_handling = bool(re.search(
            r"\b(i\s+will\s+trade\s+for\s+you|account\s+handling|demat\s+handling|managed\s+trading\s+account|manage\s+your\s+account)\b",
            lower_text
        ))

        if has_credential or has_account_handling:
            if has_credential:
                signals["CREDENTIAL_REQUEST"] = True
                fraud_signal_score += 35
            if has_account_handling:
                signals["ACCOUNT_HANDLING"] = True
                fraud_signal_score += 35

            found_red_flags.append(
                RedFlag(
                    category="Credential / Account Access Request",
                    title_en="Request for Trading Password, OTP, or Account Management",
                    title_hi="ट्रेडिंग पासवर्ड, OTP या अकाउंट हैंडलिंग की मांग",
                    explanation_en=(
                        "WHAT: The message asks for credentials (password, OTP, PIN, API key) or offers account handling services.\n"
                        "WHY: Sharing login credentials or handing over account access leads directly to unauthorized transactions and complete loss of funds.\n"
                        "DO: Never share OTPs, passwords, or Demat credentials with anyone. Legitimate brokers never ask for passwords."
                    ),
                    explanation_hi=(
                        "क्या: मैसेज में पासवर्ड, OTP या डिमैट अकाउंट एक्सेस मांगा गया है।\n"
                        "क्यों: पासवर्ड या OTP देने से आपका बैंक या ट्रेडिंग अकाउंट खाली हो सकता है।\n"
                        "क्या करें: कभी भी किसी के साथ अपना OTP या लॉगिन पासवर्ड शेयर न करें।"
                    ),
                    snippet="Credential / OTP / Account Handling Request",
                    severity="High"
                )
            )

        # ---------------------------------------------------------------------
        # 6. AUTHORITY CLAIMS & IMPERSONATION
        # ---------------------------------------------------------------------
        is_sebi_educational = bool(re.search(
            r"\b(sebi\s+investor\s+education|sebi\s+regulations?|sebi\s+registered|sebi\s+guidelines|sebi\s+website|sebi\.gov\.in)\b",
            lower_text
        )) and not (signals.get("PAYMENT_REQUEST") or signals.get("GUARANTEED_RETURN"))

        has_authority_claim = bool(re.search(
            r"\b(sebi\s+approved|sebi\s+officer|rbi\s+approved|rbi\s+licensed|govt\s+approved|government\s+certified|nse\s+approved|bse\s+approved|bank\s+officer|regulator\s+officer|official\s+investment\s+department|government\s+scheme|zerodha\s+team|groww\s+official|tata\s+mutual\s+fund|lic\s+agent|nse\s+official|bse\s+manager|angel\s+one\s+vip|सेबी\s*अधिकारी|सेबी\s*अप्रूव्ड|आरबीआई\s*लाइसेंस|सरकारी\s*मान्यता)\b",
            lower_text
        ))

        if has_authority_claim and not is_sebi_educational:
            signals["FAKE_AUTHORITY"] = True
            fraud_signal_score += 20
            signals["IMPERSONATION"] = True
            fraud_signal_score += 10
            found_red_flags.append(
                RedFlag(
                    category="Unverified Regulatory Claim",
                    title_en="Unverified Regulatory or Official Impersonation Claim",
                    title_hi="अनवेरिफाइड रेगुलेटरी या अधिकारी का दावा",
                    explanation_en=(
                        "WHAT: The sender claims to be a SEBI officer, RBI official, or certified broker representative.\n"
                        "WHY: Fraudsters frequently impersonate government officers or reputable broker brands to gain trust.\n"
                        "DO: The regulatory claim could not be independently verified. Check registration numbers directly on sebi.gov.in."
                    ),
                    explanation_hi=(
                        "क्या: मैसेज में खुद को SEBI अधिकारी या सरकारी मान्यता प्राप्त एजेंट बताया गया है।\n"
                        "क्यों: जालसाज भरोसा जीतने के लिए अधिकारियों का नाम इस्तेमाल करते हैं।\n"
                        "क्या करें: दावों की जांच सीधे सेबी (sebi.gov.in) की वेबसाइट पर करें।"
                    ),
                    snippet="Claimed SEBI / RBI / Govt association",
                    severity="High"
                )
            )

        # ---------------------------------------------------------------------
        # 7. SUSPICIOUS URLS
        # ---------------------------------------------------------------------
        urls = re.findall(r"https?://[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(?:com|in|org|net|xyz|top|tk|club|online|site|live|vip|work|info)\S*", lower_text)
        has_suspicious_url = False
        url_snippet = ""

        for url in urls:
            is_official = any(dom in url for dom in cls.OFFICIAL_DOMAINS)
            if is_official:
                continue
            is_shortener = any(short in url for short in cls.SHORTENER_DOMAINS)
            is_susp_tld = any(url.endswith(tld) or (tld + "/") in url for tld in cls.SUSPICIOUS_TLDS)

            if is_shortener or is_susp_tld or ("bit.ly" in url) or ("tinyurl" in url) or ("t.me" in url):
                has_suspicious_url = True
                url_snippet = url
                break

        if has_suspicious_url:
            signals["SUSPICIOUS_URL"] = True
            fraud_signal_score += 15
            found_red_flags.append(
                RedFlag(
                    category="Suspicious Link / URL",
                    title_en="Shortened or Suspicious Web Link Detected",
                    title_hi="संदिग्ध या छोटा (Shortened) वेब लिंक",
                    explanation_en=(
                        "WHAT: Shortened URL detected (e.g. bit.ly, tinyurl, t.me) or unverified web link.\n"
                        "WHY: The final destination is obscured, making it difficult to verify legitimacy before clicking.\n"
                        "DO: Verify the destination independently before opening. Do not enter passwords on unverified sites."
                    ),
                    explanation_hi=(
                        "क्या: मैसेज में छोटा किया गया (Shortened) या संदिग्ध लिंक है।\n"
                        "क्यों: असली वेबसाइट का पता छिपा होता है जिससे फर्जी वेबसाइट पर जाने का खतरा रहता है।\n"
                        "क्या करें: लिंक खोलने से पहले उसके असली सोर्स की जांच करें।"
                    ),
                    snippet=url_snippet[:40] if url_snippet else "Shortened / Suspicious URL",
                    severity="High"
                )
            )

        # ---------------------------------------------------------------------
        # 8. URGENCY / FOMO
        # ---------------------------------------------------------------------
        has_urgency = bool(re.search(
            r"\b(hurry|last\s+(\d+\s+)?(seats?|slots?)|only\s+(\d+\s+)?(seats?|slots?)|limited\s+(\d+\s+)?(seats?|slots?)|offer\s+valid\s+today|act\s+fast|don'?t\s+miss|join\s+immediately|urgent|act\s+now|last\s+chance|today\s+only|secret\s+opportunity|जल्दी\s*करें|आखिरी\s*\d+\s*सीटें|आज\s*ही\s*ऑफर|मौका\s*न\s*गंवाएं|तुरंत\s*जुड़ें)\b",
            lower_text
        ))
        if has_urgency:
            signals["URGENCY"] = True
            if is_actionable_trading or signals.get("PAYMENT_REQUEST") or signals.get("GUARANTEED_RETURN"):
                fraud_signal_score += 10
                found_red_flags.append(
                    RedFlag(
                        category="Urgency / FOMO",
                        title_en="High Pressure / Urgency Tactics (FOMO)",
                        title_hi="तुरंत फैसले का दबाव (FOMO/उतावलापन)",
                        explanation_en=(
                            "WHAT: The message uses high-pressure phraseology ('hurry', 'limited seats', 'act now').\n"
                            "WHY: Pressure tactics are designed to rush your decision before you can verify facts.\n"
                            "DO: Take your time. Never rush financial decisions due to artificial urgency."
                        ),
                        explanation_hi=(
                            "क्या: मैसेज में तुरंत फैसला लेने का दबाव बनाया गया है ('जल्दी करें', 'आखिरी सीटें')।\n"
                            "क्यों: दबाव डालकर आपको सोचने और जांच करने का मौका नहीं दिया जाता।\n"
                            "क्या करें: जल्दबाजी में कोई वित्तीय फैसला न लें।"
                        ),
                        snippet="Urgency / FOMO Phrase",
                        severity="Medium"
                    )
                )

        # ---------------------------------------------------------------------
        # 9. COMBINATION BONUSES & HARD SAFETY OVERRIDES
        # ---------------------------------------------------------------------
        combination_bonus = 0
        if signals.get("ACTIONABLE_TRADING") and signals.get("TARGET_OR_PRICE_LEVEL") and signals.get("STOP_LOSS"):
            combination_bonus += 10
        if signals.get("ACTIONABLE_TRADING") and signals.get("UNSOLICITED_TIP_CONTEXT"):
            combination_bonus += 10
        if signals.get("GUARANTEED_RETURN") and signals.get("PAYMENT_REQUEST"):
            combination_bonus += 20
        if signals.get("GUARANTEED_RETURN") and signals.get("UNSOLICITED_TIP_CONTEXT"):
            combination_bonus += 20
        if signals.get("FAKE_AUTHORITY") and signals.get("PAYMENT_REQUEST"):
            combination_bonus += 20
        if signals.get("CREDENTIAL_REQUEST") and signals.get("ACCOUNT_HANDLING"):
            combination_bonus += 25
        if signals.get("GUARANTEED_RETURN") and signals.get("URGENCY") and signals.get("PAYMENT_REQUEST"):
            combination_bonus += 25
        if signals.get("SUSPICIOUS_URL") and signals.get("PAYMENT_REQUEST"):
            combination_bonus += 15
        if signals.get("LIVE_REAL_TIME") and signals.get("ACTIONABLE_TRADING") and signals.get("UNSOLICITED_TIP_CONTEXT"):
            combination_bonus += 15

        total_score = content_risk_score + fraud_signal_score + combination_bonus

        # Hard Safety Overrides
        if signals.get("CREDENTIAL_REQUEST") and (signals.get("ACCOUNT_HANDLING") or "otp" in lower_text or "password" in lower_text):
            total_score = max(total_score, 85)
        if signals.get("FAKE_AUTHORITY") and signals.get("PAYMENT_REQUEST"):
            total_score = max(total_score, 85)
        if signals.get("GUARANTEED_RETURN") and signals.get("PAYMENT_REQUEST") and (signals.get("SUSPICIOUS_URL") or signals.get("URGENCY")):
            total_score = max(total_score, 85)
        elif signals.get("GUARANTEED_RETURN") and signals.get("PAYMENT_REQUEST"):
            total_score = max(total_score, 65)

        # Cap score between 0 and 100
        risk_score = min(100, max(0, total_score))

        # Determine Risk Level (0-24: LOW, 25-59: MEDIUM, 60-84: HIGH, 85-100: CRITICAL)
        if risk_score >= 85:
            risk_level = RiskLevel.CRITICAL
        elif risk_score >= 60:
            risk_level = RiskLevel.HIGH
        elif risk_score >= 25:
            risk_level = RiskLevel.MEDIUM
        else:
            risk_level = RiskLevel.LOW

        # ---------------------------------------------------------------------
        # CLAIMS, STEPS, & SUMMARIES
        # ---------------------------------------------------------------------
        claims_to_verify: List[ClaimToVerify] = []
        cls._populate_claims_to_verify(cleaned_text, found_red_flags, claims_to_verify)
        safe_next_steps = cls._generate_safe_steps(risk_level, found_red_flags)
        summary_en, summary_hi = cls._generate_summaries(risk_level, risk_score, found_red_flags)

        return AnalysisResponse(
            risk_level=risk_level,
            risk_score=risk_score,
            summary_en=summary_en,
            summary_hi=summary_hi,
            red_flags=found_red_flags,
            claims_to_verify=claims_to_verify,
            safe_next_steps=safe_next_steps,
            analyzed_text_snippet=cleaned_text[:200] + ("..." if len(cleaned_text) > 200 else ""),
            input_type="text"
        )

    @classmethod
    def _populate_claims_to_verify(cls, text: str, red_flags: List[RedFlag], claims: List[ClaimToVerify]):
        """Identifies specific claims in text that require independent verification."""
        lower_text = text.lower()

        if re.search(r"\bsebi\b", lower_text):
            claims.append(
                ClaimToVerify(
                    claim_text="Claimed SEBI Registration / Approval",
                    reason_en="The message mentions SEBI. SEBI registered advisors MUST be verified on SEBI's official portal.",
                    reason_hi="मैसेज में SEBI का जिक्र है। सेबी रजिस्टर्ड सलाहकारों की जांच SEBI की वेबसाइट पर होनी चाहिए।",
                    verification_source_en="Verify directly on SEBI Intermediary Portal (sebi.gov.in)",
                    verification_source_hi="SEBI की आधिकारिक वेबसाइट (sebi.gov.in) पर जांच करें",
                    official_link="https://www.sebi.gov.in"
                )
            )

        if re.search(r"\b(rbi|nbfc)\b", lower_text):
            claims.append(
                ClaimToVerify(
                    claim_text="Claimed RBI Registration / Banking License",
                    reason_en="The message mentions RBI approval or NBFC registration. RBI does not guarantee returns on private schemes.",
                    reason_hi="मैसेज में RBI या NBFC की बात है। RBI किसी स्कीम में रिटर्न की गारंटी नहीं देता।",
                    verification_source_en="Verify on RBI Sachet Portal (sachet.rbi.org.in)",
                    verification_source_hi="RBI के सचेत पोर्टल (sachet.rbi.org.in) पर जांच करें",
                    official_link="https://sachet.rbi.org.in"
                )
            )

        if re.search(r"(guarant?ee|assured|profit|return|2x|100%)", lower_text):
            claims.append(
                ClaimToVerify(
                    claim_text="Guaranteed Return Claim",
                    reason_en="Securities markets fluctuate daily. Guaranteed return claims are non-compliant with SEBI regulations.",
                    reason_hi="शेयर बाजार में रोजाना उतार-चढ़ाव होता है। गारंटीड रिटर्न का वादा सेबी के नियमों के खिलाफ है।",
                    verification_source_en="Check official Product Information Document (SID/KIM) or AMFI website",
                    verification_source_hi="किसी भी स्कीम के आधिकारिक दस्तावेज (SID/KIM) को पढ़ें",
                    official_link="https://www.amfiindia.com"
                )
            )

        if re.search(r"https?://|bit\.ly|t\.me|tinyurl", lower_text):
            claims.append(
                ClaimToVerify(
                    claim_text="Official Website or Channel Link",
                    reason_en="Scammers use shortened links or lookalike domains. Compare domain names carefully.",
                    reason_hi="ठग असली कंपनियों जैसे फर्जी लिंक बनाते हैं। डोमेन स्पेलिंग ध्यान से देखें।",
                    verification_source_en="Compare link with the verified official company website",
                    verification_source_hi="आधिकारिक और वेरीफाइड वेबसाइट से ही लिंक मिलाएं",
                    official_link=None
                )
            )

        if not claims:
            claims.append(
                ClaimToVerify(
                    claim_text="Unverified Investment Offer",
                    reason_en="The sender's identity and registration status cannot be confirmed from this message alone.",
                    reason_hi="मैसेज भेजने वाले की पहचान और रजिस्ट्रेशन स्थिति की स्वतंत्र जांच जरूरी है।",
                    verification_source_en="Ask for official SEBI registration number and verify on sebi.gov.in",
                    verification_source_hi="कंपनी का सेबी रजिस्ट्रेशन नंबर मांगें और पोर्टल पर चेक करें",
                    official_link="https://www.sebi.gov.in"
                )
            )

    @classmethod
    def _generate_safe_steps(cls, risk_level: RiskLevel, red_flags: List[RedFlag]) -> List[SafeStep]:
        """Generates clear, simple action items for investor safety."""
        steps: List[SafeStep] = [
            SafeStep(
                step_en="Do NOT transfer money via UPI, bank accounts, or crypto based on unverified tips.",
                step_hi="बिना जांचे किसी अनजान UPI ID या बैंक खाते में पैसे ट्रांसफर न करें।",
                priority="Critical"
            ),
            SafeStep(
                step_en="Do NOT share sensitive credentials like trading passwords, OTPs, PINs, or Demat access.",
                step_hi="अपना ट्रेडिंग पासवर्ड, OTP या डिमैट की जानकारी किसी से शेयर न करें।",
                priority="Critical"
            ),
            SafeStep(
                step_en="Do NOT click on shortened links (bit.ly, t.me) or install remote access APKs.",
                step_hi="अनजान या छोटे लिंक पर क्लिक न करें और कोई अज्ञात ऐप इंस्टॉल न करें।",
                priority="Critical"
            ),
            SafeStep(
                step_en="Independently verify any SEBI/RBI claims on official portals (sebi.gov.in or sachet.rbi.org.in).",
                step_hi="SEBI या RBI के दावों की सच्चाई केवल आधिकारिक वेबसाइट (sebi.gov.in) पर ही जांचें।",
                priority="Recommended"
            ),
            SafeStep(
                step_en="If you suspect payment fraud, report immediately to CyberCrime Helpline 1930 or cybercrime.gov.in.",
                step_hi="यदि फ्रॉड का अंदेशा हो तो तुरंत 1930 हेल्पलाइन पर कॉल करें या cybercrime.gov.in पर रिपोर्ट दर्ज करें।",
                priority="Recommended"
            )
        ]
        return steps

    @classmethod
    def _generate_summaries(cls, risk_level: RiskLevel, risk_score: int, red_flags: List[RedFlag]) -> Tuple[str, str]:
        """Generates simple English and Hindi summary strings."""
        flag_count = len(red_flags)
        if risk_level == RiskLevel.CRITICAL:
            sum_en = f"CRITICAL RISK (Score: {risk_score}/100): High-severity scam indicators detected involving guaranteed returns, payment requests, credential theft, or impersonation. Do NOT transfer money or share passwords."
            sum_hi = f"अत्यधिक गंभीर जोखिम (स्कोर: {risk_score}/100): इस मैसेज में धोखाधड़ी, पैसे मांगने, पासवर्ड/OTP या नकली अधिकारी बनने के बहुत गंभीर लक्षण मिले हैं। कोई पैसा या पासवर्ड न दें।"
        elif risk_level == RiskLevel.HIGH:
            sum_en = f"HIGH RISK (Score: {risk_score}/100): We detected {flag_count} strong risk indicators in this message. Exercise extreme caution and independently verify the source."
            sum_hi = f"उच्च जोखिम (स्कोर: {risk_score}/100): इस मैसेज में {flag_count} बड़े खतरे के निशान मिले हैं। कृपया बहुत सावधान रहें और किसी के झांसे में न आएं।"
        elif risk_level == RiskLevel.MEDIUM:
            sum_en = f"MEDIUM RISK (Score: {risk_score}/100): Potentially risky or actionable financial content ({flag_count} indicator(s)). SANGYAN cannot verify or endorse trading calls or claims."
            sum_hi = f"मध्यम जोखिम (स्कोर: {risk_score}/100): इस मैसेज में {flag_count} संदिग्ध बातें/ट्रेडिंग निर्देश मिले हैं। संज्ञान किसी भी ट्रेडिंग कॉल का समर्थन नहीं करता।"
        else:
            sum_en = f"LOW RISK (Score: {risk_score}/100): Educational or informational message. No obvious scam or fraud indicators detected."
            sum_hi = f"कम जोखिम (स्कोर: {risk_score}/100): यह सामान्य शैक्षणिक या जानकारीपूर्ण मैसेज लग रहा है। कोई बड़ा खतरा नहीं मिला।"

        return sum_en, sum_hi
