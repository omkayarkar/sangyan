export type Language = 'en' | 'hi';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RedFlag {
  key: string;
  severity: 'medium' | 'high' | 'critical';
  weight: number;
}

export interface VerificationResult {
  riskLevel: RiskLevel;
  riskScore: number;
  confidence: number;
  flags: RedFlag[];
  sebiRegFound: boolean | null;
  sebiRegNumber: string | null;
  evidence: string[];
}

export interface TipPattern {
  key: string;
  matched: boolean;
  description: string;
}

export interface TipProfileResult {
  riskLevel: RiskLevel;
  riskScore: number;
  patternsMatched: number;
  totalPatterns: number;
  patterns: TipPattern[];
}

export interface JournalEntry {
  id: string;
  date: string;
  amount: number;
  reason: string;
  horizon: 'short' | 'medium' | 'long';
  expectedOutcome: string;
  changeMind: string;
  verified: boolean;
  isLoss: boolean;
}
