import pytest
from app.services.risk_engine import RiskEngine
from app.models.schemas import RiskLevel
from app.services.verifier import VerifierService

def test_guaranteed_return_scam():
    text = "Guaranteed 100% monthly profit! SEBI approved scheme. Transfer ₹5,000 via UPI now."
    response = RiskEngine.analyze(text, requested_lang="en")

    assert response.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]
    assert response.risk_score >= 60
    assert len(response.red_flags) >= 3
    
    categories = [flag.category for flag in response.red_flags]
    assert "Guaranteed Returns" in categories
    assert "Unverified Regulatory Claim" in categories
    assert "Request for Money / Payment" in categories

def test_hindi_language_patterns():
    text = "गारंटीड 100% फायदा! 2 दिन में पैसा डबल। तुरंत व्हाट्सएप ग्रुप ज्वाइन करें।"
    response = RiskEngine.analyze(text, requested_lang="hi")

    assert response.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]
    assert len(response.red_flags) >= 2
    assert response.summary_hi is not None

def test_legitimate_informational_message():
    text = "Dear Investor, your monthly SIP of ₹1,000 for Tata Digital India Fund has been processed. Mutual funds are subject to market risks. Visit tatamutualfund.com."
    response = RiskEngine.analyze(text, requested_lang="en")

    assert response.risk_level == RiskLevel.LOW
    assert response.risk_score < 25

def test_domain_verification():
    res1 = VerifierService.verify_query("sebi.gov.in")
    assert res1.is_official_known_domain is True
    assert res1.domain_status == "VERIFIED OFFICIAL"

    res2 = VerifierService.verify_query("sebi-guaranteed-returns.xyz")
    assert res2.is_official_known_domain is False
    assert "HIGH RISK" in res2.domain_status

def test_guardrails_notice():
    response = RiskEngine.analyze("Check this stock tip", requested_lang="en")
    assert "SANGYAN is an investor-safety" in response.guardrail_notice

# =====================================================================
# SECTION 17 & 18 SPECIFIED TEST SUITE
# =====================================================================

def test_1_sell_nifty_call():
    text = "Sell NIFTY 24150 target 24060 SL 24210"
    response = RiskEngine.analyze(text)
    assert response.risk_level in [RiskLevel.MEDIUM, RiskLevel.HIGH]
    assert response.risk_score >= 25
    assert any(flag.category == "Actionable Trading Instruction" for flag in response.red_flags)

def test_2_buy_bank_nifty_ce():
    text = "BUY BANK NIFTY CE now. Target 500. SL 250."
    response = RiskEngine.analyze(text)
    assert response.risk_level in [RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL]
    assert response.risk_score >= 25

def test_3_guaranteed_profit_upi():
    text = "Guaranteed 100% profit in 7 days. Send ₹5000 UPI now."
    response = RiskEngine.analyze(text)
    assert response.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]
    assert response.risk_score >= 60

def test_4_mutual_funds_disclaimer():
    text = "Mutual funds are market-linked investments and returns are not guaranteed."
    response = RiskEngine.analyze(text)
    assert response.risk_level == RiskLevel.LOW
    assert response.risk_score <= 24

def test_5_hindi_guaranteed_upi():
    text = "गारंटीड 100% फायदा! अभी ₹5000 UPI करो."
    response = RiskEngine.analyze(text)
    assert response.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]
    assert response.risk_score >= 60

def test_6_vip_telegram_nifty():
    text = "Join our VIP Telegram. Sure-shot NIFTY calls. ₹2999 monthly."
    response = RiskEngine.analyze(text)
    assert response.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]
    assert response.risk_score >= 60

def test_7_sebi_officer_upi():
    text = "I am a SEBI officer. Send your money to this UPI to activate your account."
    response = RiskEngine.analyze(text)
    assert response.risk_level == RiskLevel.CRITICAL
    assert response.risk_score >= 85

def test_8_otp_and_account_handling():
    text = "Give me your trading login and OTP. I will manage your account and guarantee profits."
    response = RiskEngine.analyze(text)
    assert response.risk_level == RiskLevel.CRITICAL
    assert response.risk_score >= 85

def test_9_learn_stop_loss():
    text = "Learn how stop-loss orders work."
    response = RiskEngine.analyze(text)
    assert response.risk_level == RiskLevel.LOW
    assert response.risk_score <= 24

def test_10_nifty_closed():
    text = "Today's NIFTY closed at 24,150."
    response = RiskEngine.analyze(text)
    assert response.risk_level == RiskLevel.LOW
    assert response.risk_score <= 24

def test_11_live_nifty_telegram():
    text = "Live NIFTY call: BUY NOW, target 24,300, SL 24,100. Join Telegram."
    response = RiskEngine.analyze(text)
    assert response.risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]
    assert response.risk_score >= 60

def test_12_sebi_investor_education():
    text = "SEBI investor education says securities-market investments carry risk."
    response = RiskEngine.analyze(text)
    assert response.risk_level == RiskLevel.LOW
    assert response.risk_score <= 24

def test_13_guaranteed_shortened_link_upi():
    text = "Earn 2x guaranteed. Limited 5 seats. Pay via UPI. Join bit.ly/xxxxx."
    response = RiskEngine.analyze(text)
    assert response.risk_level == RiskLevel.CRITICAL
    assert response.risk_score >= 85

def test_section_18_original_nifty_regression():
    text = (
        "Vijay Mumbai: Sell risky Nifty around 24150 target 24060 sl 24210\n"
        "Vijay Mumbai: options not moving\n"
        "Some thing fishy\n"
        "Vijay Mumbai: superb in stroke all done\n"
        "Vijay Mumbai: low 24044"
    )
    response = RiskEngine.analyze(text)
    assert response.risk_level in [RiskLevel.MEDIUM, RiskLevel.HIGH, RiskLevel.CRITICAL]
    assert response.risk_score >= 25
    assert response.risk_level != RiskLevel.LOW
    categories = [flag.category for flag in response.red_flags]
    assert "Actionable Trading Instruction" in categories
