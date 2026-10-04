import { Language } from "@/types";

export const translations = {
  en: {
    appTitle: "SANGYAN (संज्ञान)",
    tagline: "Investor Safety & Content-Risk Analysis Tool",
    subtitle: "Protect yourself from WhatsApp & Telegram investment scams before sending your hard-earned money.",
    personaWelcome: "Namaste Rahul! Paste any message or upload a screenshot to check if it's safe.",
    tabPasteText: "Paste Message Text",
    tabUploadScreenshot: "Upload Screenshot / Image",
    tabInteractiveVerify: "Verify SEBI / Domain Link",
    placeholderText: "Paste WhatsApp or Telegram message here (e.g. 'Earn 100% guaranteed return in 7 days...')",
    analyzeBtn: "Analyze Risk Now",
    analyzing: "Analyzing message for financial risk...",
    uploadTitle: "Drop screenshot here or click to browse",
    uploadDesc: "Supports PNG, JPG, WEBP screenshots from WhatsApp, Telegram, or SMS",
    orTryDemo: "Or try a sample message:",
    riskLevelLabel: "AI Risk Level",
    riskScoreLabel: "Risk Assessment Score (0 - 100)",
    scoreDisclaimer: "AI-assisted risk assessment score, NOT a probability that the message is a scam.",
    redFlagsTitle: "Detected Red Flags & Explanations",
    redFlagsEmpty: "No major red flags detected. However, all investments involve market risk.",
    claimsTitle: "Claims Requiring Independent Verification",
    claimsDesc: "Verify these claims on official regulatory portals before taking action:",
    safeNextStepsTitle: "Safe Next Steps Checklist",
    verifyToolTitle: "SEBI Directory & Domain Verification Tool",
    verifyPlaceholder: "Enter domain (e.g. sebi.gov.in) or SEBI Reg No...",
    verifyBtn: "Verify Entity",
    speechBtnListen: "Listen Analysis (Voice)",
    speechBtnStop: "Stop Voice",
    privacyNotice: "🔒 Privacy First: SANGYAN never asks for OTPs, passwords, or bank credentials. Uploaded text/screenshots are never permanently stored.",
    guardrailFooter: "🛡️ Safety Notice: SANGYAN is an investor safety and risk evaluation tool. It NEVER provides stock recommendations, trading signals, or financial advice."
  },
  hi: {
    appTitle: "संज्ञान (SANGYAN)",
    tagline: "निवेशक सुरक्षा एवं जोखिम विश्लेषण",
    subtitle: "अपनी मेहनत की कमाई भेजने से पहले व्हाट्सएप और टेलीग्राम मैसेज की जांच करें।",
    personaWelcome: "नमस्ते राहुल! कोई भी मैसेज या स्क्रीनशॉट डालकर जांचें कि वह सुरक्षित है या नहीं।",
    tabPasteText: "मैसेज टेक्स्ट पेस्ट करें",
    tabUploadScreenshot: "स्क्रीनशॉट / फोटो अपलोड करें",
    tabInteractiveVerify: "SEBI / लिंक की जांच करें",
    placeholderText: "व्हाट्सएप या टेलीग्राम का मैसेज यहाँ पेस्ट करें (जैसे: '7 दिन में 100% गारंटीड मुनाफा...')",
    analyzeBtn: "जोखिम की जांच करें",
    analyzing: "मैसेज की जांच की जा रही है...",
    uploadTitle: "यहाँ स्क्रीनशॉट खींचकर डालें या क्लिक करें",
    uploadDesc: "व्हाट्सएप, टेलीग्राम या एसएमएस के फोटो (PNG, JPG) अपलोड करें",
    orTryDemo: "या इन सैंपल मैसेज पर क्लिक करके देखें:",
    riskLevelLabel: "जोखिम स्तर (Risk Level)",
    riskScoreLabel: "जोखिम अंक (0 - 100)",
    scoreDisclaimer: "यह AI द्वारा आँका गया जोखिम स्कोर है, फ्रॉड की अंतिम संभावना नहीं।",
    redFlagsTitle: "पहचाने गए खतरे के निशान (Red Flags)",
    redFlagsEmpty: "कोई बड़ा खतरा नहीं मिला। फिर भी शेयर बाजार में निवेश जोखिम भरा होता है।",
    claimsTitle: "वे दावे जिनकी जांच जरूरी है (Claims to Verify)",
    claimsDesc: "कोई भी कदम उठाने से पहले सरकारी या आधिकारिक वेबसाइट पर इन दावों की पुष्टि करें:",
    safeNextStepsTitle: "सुरक्षित कदम (Safe Next Steps)",
    verifyToolTitle: "SEBI पोर्टल एवं वेबसाइट जांच टूल",
    verifyPlaceholder: "वेबसाइट लिंक (जैसे sebi.gov.in) या SEBI नंबर दर्ज करें...",
    verifyBtn: "जांचें",
    speechBtnListen: "आवाज़ में सुनें (Voice)",
    speechBtnStop: "आवाज़ बंद करें",
    privacyNotice: "🔒 गोपनीयता: संज्ञान कभी भी OTP, पासवर्ड या बैंक खाता विवरण नहीं मांगता। आपकी जानकारी सुरक्षित है।",
    guardrailFooter: "🛡️ सुरक्षा सूचना: संज्ञान केवल धोखाधड़ी से बचाने का टूल है। यह शेयर खरीदने/बेचने की सलाह नहीं देता।"
  }
};

export function getTranslation(lang: Language) {
  return translations[lang] || translations.en;
}
