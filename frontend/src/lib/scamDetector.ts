import type { RedFlag, VerificationResult, RiskLevel, TipPattern, TipProfileResult } from '@/lib/types';

const SEBI_REG_PATTERN = /(?:SEBI|sebi)[\s]*(?:Reg|Registration|Registered)[.\s]*(?:No|Number)?[:\s]*([A-Z]{2,5}[/\-]\d{6,8})/i;
const SEBI_REG_PATTERN_2 = /(?:INA|INP|INH|INZ|INC|IND)[\/\-]\d{6,8}/i;

// Simulated SEBI registry — in production this would be an API call to sebi.gov.in
const SIMULATED_VALID_SEBI_REGS = new Set([
  'INA000000001',
  'INA000000002',
  'INA000000123',
  'INP000000001',
  'INH000000001',
]);

const URL_PATTERN = /https?:\/\/[^\s]+/gi;
const TELEGRAM_PATTERN = /(telegram|t\.me)\b/gi;
const WHATSAPP_NUMBER_PATTERN = /(?:whatsapp|whats app|wa)[\s]*(?:on|at|@)?[\s]*(?:\+?91)?[\s]*[6-9]\d{9}/gi;
const RETURN_PERCENTAGE_PATTERN = /(\d{1,3})\s*%\s*(?:monthly|per month|per annum|annually|yearly|in\s*\d+\s*days?|in\s*\d+\s*months?|in\s*\d+\s*weeks?|returns?|profit|gain|roi)/gi;
const GUARANTEE_PATTERN = /(guarantee[ds]?|guaranteed|assured|sure[\s-]?shot|risk[\s-]?free|100%\s*safe|no risk|zero risk)/gi;
const URGENCY_PATTERN = /(urgent|immediately|today only|limited (?:time|offer)|last chance|don'?t miss|act now|hurry|before.*(?:expires?|ends?)|only.*(?:seats?|spots?|slots?)\s*left)/gi;
const KYC_PATTERN = /(kyc|know your customer)[\s]*(?:update|pending|expired|required|verification|verify)/gi;
const REMOTE_ACCESS_PATTERN = /(anydesk|teamviewer|remote (?:access|control|desktop)|screen (?:share|sharing)|quick ?support)/gi;
const PUMP_DUMP_PATTERN = /(target\s*\d+|buy\s*(?:now|today)|don'?t miss|big announcement|sure shot|multibagger|jackpot|boom|rockets?)/gi;
const DEEPFAKE_PATTERN = /(deepfake|ai\s*generated|voice clone|video clone)/gi;

interface FlagDefinition {
  key: string;
  severity: 'medium' | 'high' | 'critical';
  weight: number;
  test: (text: string) => boolean;
}

const FLAG_DEFINITIONS: FlagDefinition[] = [
  {
    key: 'unrealisticReturns',
    severity: 'critical',
    weight: 30,
    test: (text) => {
      const matches = [...text.matchAll(RETURN_PERCENTAGE_PATTERN)];
      for (const match of matches) {
        const pct = parseInt(match[1], 10);
        const fullMatch = match[0].toLowerCase();
        if (fullMatch.includes('monthly') || fullMatch.includes('per month')) {
          if (pct >= 12) return true;
        }
        if (fullMatch.includes('days') || fullMatch.includes('week')) {
          if (pct >= 20) return true;
        }
        if (pct >= 50) return true;
      }
      return false;
    },
  },
  {
    key: 'guaranteedReturns',
    severity: 'critical',
    weight: 25,
    test: (text) => GUARANTEE_PATTERN.test(text),
  },
  {
    key: 'urgencyLanguage',
    severity: 'high',
    weight: 18,
    test: (text) => URGENCY_PATTERN.test(text),
  },
  {
    key: 'unregisteredEntity',
    severity: 'critical',
    weight: 28,
    test: (text) => {
      const regMatch = text.match(SEBI_REG_PATTERN) || text.match(SEBI_REG_PATTERN_2);
      if (regMatch) {
        const regNum = regMatch[1] || regMatch[0];
        const normalized = regNum.replace(/\s/g, '').toUpperCase();
        return !SIMULATED_VALID_SEBI_REGS.has(normalized);
      }
      return false;
    },
  },
  {
    key: 'telegramChannel',
    severity: 'high',
    weight: 15,
    test: (text) => TELEGRAM_PATTERN.test(text),
  },
  {
    key: 'suspiciousLink',
    severity: 'high',
    weight: 16,
    test: (text) => {
      const urls = [...text.matchAll(URL_PATTERN)].map((m) => m[0].toLowerCase());
      if (urls.length === 0) return false;
      return urls.some((url) => {
        const domain = url.replace(/https?:\/\//, '').split('/')[0];
        return (
          domain.includes('sebi-') ||
          domain.includes('-sebi') ||
          domain.includes('kyc-') ||
          domain.includes('-kyc') ||
          domain.includes('verify-') ||
          domain.includes('-update') ||
          domain.includes('bit.ly') ||
          domain.includes('tinyurl') ||
          domain.includes('t.me/') ||
          (!domain.includes('sebi.gov.in') && domain.includes('sebi'))
        );
      });
    },
  },
  {
    key: 'kycFraud',
    severity: 'critical',
    weight: 26,
    test: (text) => {
      if (!KYC_PATTERN.test(text)) return false;
      return URL_PATTERN.test(text) || WHATSAPP_NUMBER_PATTERN.test(text);
    },
  },
  {
    key: 'remoteAccess',
    severity: 'critical',
    weight: 27,
    test: (text) => REMOTE_ACCESS_PATTERN.test(text),
  },
  {
    key: 'pumpDump',
    severity: 'high',
    weight: 20,
    test: (text) => PUMP_DUMP_PATTERN.test(text),
  },
  {
    key: 'whatsappNumber',
    severity: 'medium',
    weight: 12,
    test: (text) => WHATSAPP_NUMBER_PATTERN.test(text),
  },
  {
    key: 'deepfakeIndicator',
    severity: 'high',
    weight: 18,
    test: (text) => DEEPFAKE_PATTERN.test(text),
  },
  {
    key: 'limitedOffer',
    severity: 'medium',
    weight: 10,
    test: (text) => /limited\s*(?:time|offer|period|seats?|spots?)\b/gi.test(text),
  },
];

function scoreToLevel(score: number): RiskLevel {
  if (score >= 60) return 'critical';
  if (score >= 35) return 'high';
  if (score >= 15) return 'medium';
  return 'low';
}

function checkSebiRegistry(text: string): { found: boolean | null; number: string | null } {
  const regMatch = text.match(SEBI_REG_PATTERN) || text.match(SEBI_REG_PATTERN_2);
  if (!regMatch) return { found: null, number: null };
  const regNum = (regMatch[1] || regMatch[0]).replace(/\s/g, '').toUpperCase();
  return {
    found: SIMULATED_VALID_SEBI_REGS.has(regNum),
    number: regNum,
  };
}

export function analyzeScam(text: string): VerificationResult {
  if (!text || text.trim().length < 5) {
    return {
      riskLevel: 'low',
      riskScore: 0,
      confidence: 0,
      flags: [],
      sebiRegFound: null,
      sebiRegNumber: null,
      evidence: [],
    };
  }

  const flags: RedFlag[] = [];
  const evidence: string[] = [];

  for (const def of FLAG_DEFINITIONS) {
    if (def.test(text)) {
      flags.push({ key: def.key, severity: def.severity, weight: def.weight });
    }
  }

  const rawScore = flags.reduce((sum, f) => sum + f.weight, 0);
  const riskScore = Math.min(rawScore, 100);

  const sebiCheck = checkSebiRegistry(text);
  if (sebiCheck.number) {
    evidence.push(
      sebiCheck.found
        ? `SEBI Reg: ${sebiCheck.number} — found in registry (simulated)`
        : `SEBI Reg: ${sebiCheck.number} — NOT found in registry`
    );
  }

  const urls = [...text.matchAll(URL_PATTERN)].map((m) => m[0]);
  if (urls.length > 0) {
    evidence.push(`URLs found: ${urls.join(', ')}`);
  }

  const returnMatches = [...text.matchAll(RETURN_PERCENTAGE_PATTERN)].map((m) => m[0]);
  if (returnMatches.length > 0) {
    evidence.push(`Return claims: ${returnMatches.slice(0, 3).join(', ')}`);
  }

  const confidence = Math.min(70 + flags.length * 8, 98);

  return {
    riskLevel: scoreToLevel(riskScore),
    riskScore,
    confidence,
    flags,
    sebiRegFound: sebiCheck.found,
    sebiRegNumber: sebiCheck.number,
    evidence,
  };
}

// Tip-Group Risk Profiler
const TIP_PATTERNS: { key: string; test: (text: string) => boolean }[] = [
  { key: 'pumpDump', test: (t) => /(?:buy\s*(?:now|today|quick)|target\s*\d+%?|multibagger|jackpot|rocket|boom)/gi.test(t) },
  { key: 'guaranteedReturns', test: (t) => /(?:guarantee[ds]?|assured|sure[\s-]?shot|risk[\s-]?free|100%)/gi.test(t) },
  { key: 'insiderInfo', test: (t) => /(?:insider|confidential|inside info|big announcement|news leak|before.*public)/gi.test(t) },
  { key: 'urgency', test: (t) => /(?:today|now|hurry|don'?t miss|last chance|limited|before|urgent|immediately)/gi.test(t) },
  { key: 'targetPrice', test: (t) => /(?:target|tp|price\s*will|reach|hit\s*\$?\d|gain\s*\d+%?)/gi.test(t) },
  { key: 'groupCoordination', test: (t) => /(?:join|group|channel|everyone buy|all buy|let'?s buy|together)/gi.test(t) },
  { key: 'celebrityEndorsement', test: (t) => /(?:celebrity|famous|influencer|viral|trending|big name)/gi.test(t) },
  { key: 'forwardChain', test: (t) => /(?:forward|share|send to|forwarded|fwd|share\s*with)/gi.test(t) },
];

export function profileTip(text: string, flagLabels: Record<string, string>): TipProfileResult {
  const patterns: TipPattern[] = TIP_PATTERNS.map((p) => ({
    key: p.key,
    matched: p.test(text),
    description: flagLabels[p.key] || p.key,
  }));

  const matchedCount = patterns.filter((p) => p.matched).length;
  const riskScore = Math.min(matchedCount * 15, 100);

  return {
    riskLevel: scoreToLevel(riskScore),
    riskScore,
    patternsMatched: matchedCount,
    totalPatterns: TIP_PATTERNS.length,
    patterns,
  };
}

// Simulate async processing with loading stages
export function simulateDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
