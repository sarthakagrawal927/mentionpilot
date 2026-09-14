export type EvidenceScoreStatus = 'missing' | 'weak' | 'clear' | 'strong';
export type EvidenceTaskPriority = 'high' | 'medium';

export interface BrandEvidenceInput {
  brandName: string;
  brandUrl: string;
  buyerMission: string;
  targetSegment?: string | null;
  competitors?: Array<{ name: string; url?: string }>;
  evidenceText?: string | null;
  evidenceUrls?: string[];
}

export interface BrandEvidenceScore {
  area: string;
  status: EvidenceScoreStatus;
  score: number;
  evidenceUrls: string[];
  notes: string;
}

export interface BrandEvidenceTask {
  area: string;
  title: string;
  priority: EvidenceTaskPriority;
}

export interface BrandEvidenceAudit {
  overallScore: number;
  recommendationSummary: string;
  scores: BrandEvidenceScore[];
  tasks: BrandEvidenceTask[];
}

interface EvidenceArea {
  area: string;
  strong: RegExp[];
  clear: RegExp[];
  weak: RegExp[];
  task: string;
}

const EVIDENCE_AREAS: EvidenceArea[] = [
  {
    area: 'positioning',
    strong: [/for\s+[^.]{8,80}\s+who/i, /built for/i, /not for/i],
    clear: [/\bplatform\b/i, /\bproduct\b/i, /\bworkflow\b/i, /\bteams?\b/i],
    weak: [/\bai\b/i, /\bautomate(?:d|s|ion)?\b/i, /\bbetter\b/i],
    task: 'State the target buyer, painful job, promised outcome, and who should not use it.',
  },
  {
    area: 'pricing',
    strong: [/\$\d+|\d+\s*\/\s*mo|\b(?:pricing starts|starter|pro|enterprise)\b/i],
    clear: [/\b(?:pricing|plans?|free trial|subscription)\b/i],
    weak: [/\b(?:contact sales|request pricing)\b/i],
    task: 'Publish clear pricing, plan boundaries, implementation cost, or why pricing is custom.',
  },
  {
    area: 'proof',
    strong: [/\bcase stud(y|ies)\b|\d+%|\b(?:saved|reduced|increased|customer result)\b/i],
    clear: [/\b(?:testimonial|customer|logo|result|proof)\b/i],
    weak: [/\b(?:trusted by|loved by)\b/i],
    task: 'Add proof with numbers, customer segment, timeline, and before-and-after outcome.',
  },
  {
    area: 'comparisons',
    strong: [/ vs |versus|alternatives?|compare|why choose/i],
    clear: [/competitor|instead of|switch from/i],
    weak: [/better than/i],
    task: 'Create comparison pages for the main alternatives and explain when each is a fit.',
  },
  {
    area: 'docs',
    strong: [/\b(?:docs?|api|quickstart|implementation guide|integration guide)\b/i],
    clear: [/\b(?:guide|setup|integrations?|webhook|sdk)\b/i],
    weak: [/\b(?:learn more|how it works)\b/i],
    task: 'Publish implementation docs, integrations, setup time, and technical limits.',
  },
  {
    area: 'policies',
    strong: [/refund|cancellation|support policy|security|privacy|sla|compliance/i],
    clear: [/support|privacy|terms|secure/i],
    weak: [/contact us|help/i],
    task: 'Make support, cancellation, security, and privacy terms easy to find and cite.',
  },
  {
    area: 'reviews',
    strong: [/g2|capterra|product hunt|reddit|reviews?|rating|third-party/i],
    clear: [/testimonial|community|social proof/i],
    weak: [/people say|users love/i],
    task: 'Collect third-party review sources that assistants can cite.',
  },
  {
    area: 'transaction readiness',
    strong: [/checkout|sign up|book demo|api|feed|schema|structured data/i],
    clear: [/demo|waitlist|contact|onboarding/i],
    weak: [/coming soon|join/i],
    task: 'Expose a clear next step plus structured product data where relevant.',
  },
];

function normalizeInput(input: BrandEvidenceInput): BrandEvidenceInput {
  return {
    ...input,
    brandName: input.brandName.trim(),
    brandUrl: input.brandUrl.trim(),
    buyerMission: input.buyerMission.trim(),
    targetSegment: input.targetSegment?.trim() || null,
    competitors: (input.competitors ?? [])
      .map((competitor) => ({ name: competitor.name.trim(), url: competitor.url?.trim() }))
      .filter((competitor) => competitor.name),
    evidenceText: input.evidenceText?.trim() || null,
    evidenceUrls: [...new Set([input.brandUrl, ...(input.evidenceUrls ?? [])].filter(Boolean))],
  };
}

function statusFor(area: EvidenceArea, corpus: string): EvidenceScoreStatus {
  if (area.strong.some((pattern) => pattern.test(corpus))) return 'strong';
  if (area.clear.some((pattern) => pattern.test(corpus))) return 'clear';
  if (area.weak.some((pattern) => pattern.test(corpus))) return 'weak';
  return 'missing';
}

function scoreFor(status: EvidenceScoreStatus) {
  if (status === 'strong') return 90;
  if (status === 'clear') return 70;
  if (status === 'weak') return 40;
  return 0;
}

export function auditBrandEvidence(input: BrandEvidenceInput): BrandEvidenceAudit {
  const normalized = normalizeInput(input);
  // Score only observed page evidence. Profile fields describe the desired
  // positioning; counting them as public proof would inflate the audit.
  const corpus = normalized.evidenceText ?? '';
  const scores = EVIDENCE_AREAS.map((area): BrandEvidenceScore => {
    const status = statusFor(area, corpus);
    return {
      area: area.area,
      status,
      score: scoreFor(status),
      evidenceUrls: status === 'missing' ? [] : (normalized.evidenceUrls ?? []),
      notes:
        status === 'missing'
          ? `${area.area} is missing from the supplied evidence.`
          : `${area.area} evidence is ${status}.`,
    };
  });
  const overallScore = Math.round(scores.reduce((sum, item) => sum + item.score, 0) / scores.length);
  const missing = scores.filter((item) => item.status === 'missing').map((item) => item.area);
  const tasks = scores
    .filter((item) => item.status === 'missing' || item.status === 'weak')
    .map((item): BrandEvidenceTask => ({
      area: item.area,
      title: EVIDENCE_AREAS.find((area) => area.area === item.area)?.task ?? `Strengthen ${item.area}.`,
      priority: item.status === 'missing' ? 'high' : 'medium',
    }));
  const recommendationSummary =
    overallScore >= 75
      ? `${normalized.brandName} has strong agent-readable evidence for ${normalized.buyerMission}.`
      : overallScore >= 50
        ? `${normalized.brandName} is plausible, but should strengthen ${missing.slice(0, 3).join(', ') || 'its weaker evidence areas'}.`
        : `${normalized.brandName} is difficult for assistants to verify until its public evidence improves.`;
  return { overallScore, recommendationSummary, scores, tasks };
}

export type VisibilityIntentCategory =
  | 'category_discovery'
  | 'direct_comparison'
  | 'displacement_risk'
  | 'trust_audit'
  | 'decision_support';

export interface CompetitorPromptTemplate {
  key: string;
  category: VisibilityIntentCategory;
  rationale: string;
  template: string;
}

export const COMPETITOR_PROMPT_TEMPLATES: CompetitorPromptTemplate[] = [
  {
    key: 'category',
    category: 'category_discovery',
    rationale: 'Tests unprompted category visibility.',
    template: 'What are the best tools for {mission}?',
  },
  {
    key: 'comparison',
    category: 'direct_comparison',
    rationale: 'Tests head-to-head positioning.',
    template: 'Compare {brand} and {competitor} for {mission}.',
  },
  {
    key: 'alternatives',
    category: 'displacement_risk',
    rationale: 'Shows which products displace the brand.',
    template: 'What are the best alternatives to {brand}?',
  },
  {
    key: 'complaints',
    category: 'trust_audit',
    rationale: 'Surfaces public objections and weak proof.',
    template: 'What are the most common complaints about {brand}?',
  },
  {
    key: 'reviews',
    category: 'trust_audit',
    rationale: 'Checks whether third-party evidence is cited.',
    template: 'What do independent reviews and Reddit say about {brand} compared with {competitor}?',
  },
  {
    key: 'pricing',
    category: 'decision_support',
    rationale: 'Checks purchase-critical commercial facts.',
    template: "What is {brand}'s pricing, cancellation policy, and support commitment?",
  },
  {
    key: 'fit',
    category: 'decision_support',
    rationale: 'Tests whether positioning has clear boundaries.',
    template: 'Who should use {brand}, and who is better served by {competitor}?',
  },
];

export function hydrateCompetitorPrompt(
  template: CompetitorPromptTemplate,
  input: { brand: string; competitor: string; mission: string }
) {
  return template.template
    .replaceAll('{brand}', input.brand)
    .replaceAll('{competitor}', input.competitor)
    .replaceAll('{mission}', input.mission);
}

export function competitorPromptSet(input: { brand: string; competitor: string; mission: string }) {
  return COMPETITOR_PROMPT_TEMPLATES.map((template) => ({
    ...template,
    prompt: hydrateCompetitorPrompt(template, input),
  }));
}

export type PerceptionBucket = 'complaint' | 'praise' | 'pricing' | 'feature_request' | 'positioning';

export interface PerceptionMention {
  id: string;
  brand: string;
  isCompetitor: boolean;
  source: string;
  url: string;
  text: string;
}

const PERCEPTION_RULES: Array<[PerceptionBucket, RegExp]> = [
  ['pricing', /price|pricing|pay|paid|package/i],
  ['feature_request', /want|wish|should|need|missing|before I/i],
  ['complaint', /cannot|can't|confusing|hard|does not|doesn't|but/i],
  ['praise', /useful|strong|polished|easy/i],
  ['positioning', /enterprise|team|competitor|monthly|report/i],
];

export function clusterCompetitorPerception(mentions: PerceptionMention[]) {
  const grouped = new Map<PerceptionBucket, PerceptionMention[]>();
  for (const mention of mentions) {
    const bucket = PERCEPTION_RULES.find(([, rule]) => rule.test(mention.text))?.[0] ?? 'positioning';
    grouped.set(bucket, [...(grouped.get(bucket) ?? []), mention]);
  }
  const clusters = Array.from(grouped, ([bucket, items]) => ({ bucket, mentions: items }));
  return {
    mentionCount: mentions.length,
    ownedMentions: mentions.filter((mention) => !mention.isCompetitor).length,
    competitorMentions: mentions.filter((mention) => mention.isCompetitor).length,
    clusters,
  };
}

export type CommunityOpportunityIntent =
  | 'complaint'
  | 'purchase_intent'
  | 'feature_request'
  | 'operational_risk'
  | 'market_signal'
  | 'startup_validation'
  | 'developer_workflow'
  | 'general';

export interface CommunityOpportunityInput {
  id: string;
  source: string;
  url: string;
  title: string;
  body?: string | null;
  publishedAt?: string | null;
  intent?: CommunityOpportunityIntent;
}

export interface CommunityOpportunity extends CommunityOpportunityInput {
  score: number;
  intent: CommunityOpportunityIntent;
  matchedKeywords: string[];
}

const OPPORTUNITY_INTENTS: Array<{
  intent: Exclude<CommunityOpportunityIntent, 'general'>;
  terms: string[];
}> = [
  {
    intent: 'complaint',
    terms: ['complaint', 'problem', 'broken', 'frustrating', 'annoying', 'issue', 'bug', 'pain'],
  },
  {
    intent: 'purchase_intent',
    terms: [
      'buy',
      'pay',
      'pricing',
      'budget',
      'vendor',
      'alternative',
      'recommend',
      'looking for',
      'switch',
      'worth it',
    ],
  },
  {
    intent: 'feature_request',
    terms: [
      'feature',
      'need',
      'wish',
      'missing',
      'request',
      'support for',
      'integration',
      'would like',
      'should add',
    ],
  },
  {
    intent: 'operational_risk',
    terms: ['cashflow', 'payroll', 'refund', 'support', 'chargeback', 'outage', 'delay'],
  },
  {
    intent: 'market_signal',
    terms: ['market', 'forecast', 'demand', 'margin', 'revenue'],
  },
  {
    intent: 'startup_validation',
    terms: ['startup', 'validate', 'launch', 'waitlist', 'customer discovery', 'mvp'],
  },
  {
    intent: 'developer_workflow',
    terms: ['github', 'deploy', 'debug', 'workflow', 'observability', 'code review', 'developer', 'api'],
  },
];

const OPPORTUNITY_INTENT_WEIGHT: Record<CommunityOpportunityIntent, number> = {
  purchase_intent: 30,
  complaint: 26,
  feature_request: 24,
  startup_validation: 20,
  operational_risk: 16,
  market_signal: 14,
  developer_workflow: 12,
  general: 4,
};

function inferCommunityOpportunityIntent(text: string): CommunityOpportunityIntent {
  const normalized = text.toLowerCase();
  let best: { intent: CommunityOpportunityIntent; matches: number } = {
    intent: 'general',
    matches: 0,
  };
  for (const candidate of OPPORTUNITY_INTENTS) {
    const matches = candidate.terms.filter((term) => normalized.includes(term)).length;
    if (matches > best.matches) best = { intent: candidate.intent, matches };
  }
  return best.intent;
}

function communityOpportunityRecencyPoints(publishedAt: string | null | undefined, now: Date) {
  if (!publishedAt) return 5;
  const published = new Date(publishedAt).getTime();
  if (!Number.isFinite(published)) return 5;
  const ageDays = Math.max(0, Math.floor((now.getTime() - published) / 86_400_000));
  if (ageDays <= 1) return 20;
  if (ageDays <= 3) return 15;
  if (ageDays <= 7) return 10;
  return 5;
}

/** Rank one Reddit or forum record for a brand. Records without a keyword match are omitted. */
export function scoreCommunityOpportunity(
  input: CommunityOpportunityInput,
  keywords: string[],
  now: Date = new Date()
): CommunityOpportunity | null {
  const normalizedKeywords = keywords.map((keyword) => keyword.trim()).filter(Boolean);
  const title = input.title.toLowerCase();
  const corpus = `${input.title}\n${input.body ?? ''}`.toLowerCase();
  const matchedKeywords = normalizedKeywords.filter((keyword) =>
    corpus.includes(keyword.toLowerCase())
  );
  if (matchedKeywords.length === 0) return null;

  const titleHits = normalizedKeywords.filter((keyword) =>
    title.includes(keyword.toLowerCase())
  ).length;
  const intent = input.intent ?? inferCommunityOpportunityIntent(corpus);
  const relevance = Math.min(50, titleHits * 18 + matchedKeywords.length * 8);
  const score = Math.max(
    0,
    Math.min(
      100,
      relevance +
        OPPORTUNITY_INTENT_WEIGHT[intent] +
        communityOpportunityRecencyPoints(input.publishedAt, now)
    )
  );
  return { ...input, score, intent, matchedKeywords };
}

export function rankCommunityOpportunities(
  inputs: CommunityOpportunityInput[],
  keywords: string[],
  options: { minimumScore?: number; now?: Date } = {}
) {
  const minimumScore = options.minimumScore ?? 0;
  const now = options.now ?? new Date();
  return inputs
    .map((input) => scoreCommunityOpportunity(input, keywords, now))
    .filter(
      (opportunity): opportunity is CommunityOpportunity =>
        opportunity !== null && opportunity.score >= minimumScore
    )
    .sort((left, right) => right.score - left.score);
}
