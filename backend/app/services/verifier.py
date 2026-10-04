import re
from typing import Optional
from app.models.schemas import QuickVerifyResponse

class VerifierService:
    """
    Verification assistant for checking official financial domains, 
    SEBI registrations, and RBI licenses.
    """

    KNOWN_OFFICIAL_DOMAINS = {
        "sebi.gov.in": "SEBI Official Regulatory Portal",
        "rbi.org.in": "Reserve Bank of India Official Portal",
        "sachet.rbi.org.in": "RBI Sachet Portal for Illegal Deposits",
        "cybercrime.gov.in": "National Cyber Crime Reporting Portal",
        "zerodha.com": "Zerodha Broking Ltd.",
        "groww.in": "Groww (Nextbillion Technology)",
        "angelone.in": "Angel One Ltd.",
        "upstox.com": "Upstox (RKSV Securities)",
        "tatamutualfund.com": "Tata Mutual Fund",
        "amfiindia.com": "Association of Mutual Funds in India (AMFI)",
        "nseindia.com": "National Stock Exchange of India",
        "bseindia.com": "BSE Limited"
    }

    SUSPICIOUS_DOMAIN_KEYWORDS = [
        "sebi-", "rbi-", "zerodha-", "groww-", "tata-mf", "guaranteed-returns",
        "insider-tips", "free-profit", "crypto-vip", "double-money"
    ]

    @classmethod
    def verify_query(cls, query: str) -> QuickVerifyResponse:
        cleaned_query = query.strip().lower()

        # Check if query is a domain or URL or contains dot
        if re.search(r"https?://|\.|\b(com|in|org|gov|xyz|top|site|net|co)\b", cleaned_query):
            # Extract domain
            domain_match = re.search(r"(?:https?://)?(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})", cleaned_query)
            if domain_match:
                domain = domain_match.group(1)
                
                # Check known official list
                for official_domain, name in cls.KNOWN_OFFICIAL_DOMAINS.items():
                    if domain == official_domain or domain.endswith("." + official_domain):
                        return QuickVerifyResponse(
                            query=query,
                            is_official_known_domain=True,
                            domain_status="VERIFIED OFFICIAL",
                            guidance_en=f"'{domain}' is recognized as an official verified portal ({name}).",
                            guidance_hi=f"'{domain}' एक असली और वेरीफाइड आधिकारिक पोर्टल ({name}) है।",
                            official_portal_link=f"https://{domain}"
                        )

                # Check for suspicious lookalike domains
                for kw in cls.SUSPICIOUS_DOMAIN_KEYWORDS:
                    if kw in domain:
                        return QuickVerifyResponse(
                            query=query,
                            is_official_known_domain=False,
                            domain_status="HIGH RISK / SUSPICIOUS LOOKALIKE",
                            guidance_en=f"WARNING: '{domain}' contains keywords often used in fake impersonation websites. It is NOT the official SEBI or broker domain.",
                            guidance_hi=f"सावधान: '{domain}' में ऐसे शब्द हैं जो नकली वेबसाइटों में इस्तेमाल होते हैं। यह SEBI या असली ब्रोकर का लिंक नहीं है।",
                            official_portal_link="https://www.sebi.gov.in"
                        )

                return QuickVerifyResponse(
                    query=query,
                    is_official_known_domain=False,
                    domain_status="UNVERIFIED DOMAIN",
                    guidance_en=f"'{domain}' is not in the list of recognized Indian regulatory or registered broker portals. Proceed with caution.",
                    guidance_hi=f"'{domain}' मान्यता प्राप्त सरकारी या सेबी ब्रोकर लिस्ट में नहीं मिला। सावधान रहें।",
                    official_portal_link="https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes"
                )

        # Check if query looks like a SEBI Registration number (e.g. INZ000123456 or INH000001234)
        if re.search(r"\bIN[A-Z0-9]{9,12}\b", query.upper()):
            reg_no = query.upper()
            return QuickVerifyResponse(
                query=query,
                is_official_known_domain=True,
                domain_status="SEBI REGISTRATION NUMBER FORMAT VALIDated",
                guidance_en=f"Registration string '{reg_no}' matches standard SEBI format. ALWAYS verify if the registration is active on sebi.gov.in.",
                guidance_hi=f"पंजीकरण संख्या '{reg_no}' सेबी फॉर्मेट से मेल खाती है। इसकी सक्रिय स्थिति sebi.gov.in पर जरूर चेक करें।",
                official_portal_link="https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes"
            )

        # General text query (e.g. company name)
        return QuickVerifyResponse(
            query=query,
            is_official_known_domain=False,
            domain_status="MANUAL VERIFICATION REQUIRED",
            guidance_en=f"To verify if '{query}' is SEBI registered, search on the SEBI Intermediaries Directory portal or RBI Sachet portal.",
            guidance_hi=f"यह जांचने के लिए कि क्या '{query}' सेबी रजिस्टर्ड है, सेबी के आधिकारिक पोर्टल (sebi.gov.in) पर नाम खोजें।",
            official_portal_link="https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes"
        )
