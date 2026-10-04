import type { Language } from './types';

const BASE_URL = 'http://127.0.0.1:8000';

export interface BackendRedFlag {
  category: string;
  title_en: string;
  title_hi: string;
  explanation_en: string;
  explanation_hi: string;
  snippet?: string;
  severity: string;
}

export interface BackendClaimToVerify {
  claim_text: string;
  reason_en: string;
  reason_hi: string;
  verification_source_en: string;
  verification_source_hi: string;
  official_link?: string;
}

export interface BackendSafeStep {
  step_en: string;
  step_hi: string;
  priority: string;
}

export interface BackendAnalysisResponse {
  risk_level: 'Low' | 'Medium' | 'High' | 'Critical';
  risk_score: number;
  risk_score_label: string;
  summary_en: string;
  summary_hi: string;
  red_flags: BackendRedFlag[];
  claims_to_verify: BackendClaimToVerify[];
  safe_next_steps: BackendSafeStep[];
  analyzed_text_snippet: string;
  input_type: string;
  guardrail_notice: string;
}

export interface BackendAssistantResponse {
  answer: string;
}

export async function analyzeText(
  text: string,
  language: Language = 'en'
): Promise<BackendAnalysisResponse> {
  const response = await fetch(`${BASE_URL}/api/analyze/text`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      language,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Backend request failed with status ${response.status}`
    );
  }

  return response.json();
}

export async function analyzeImage(
  file: File,
  language: Language = 'en'
): Promise<BackendAnalysisResponse> {
  const formData = new FormData();

  formData.append('file', file);
  formData.append('language', language);

  const response = await fetch(`${BASE_URL}/api/analyze/image`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      `Image analysis failed with status ${response.status}`
    );
  }

  return response.json();
}

export async function askAssistant(
  message: string,
  language: Language = 'en'
): Promise<BackendAssistantResponse> {
  const response = await fetch(`${BASE_URL}/api/assistant/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      language,
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Assistant query failed with status ${response.status}`
    );
  }

  return response.json();
}