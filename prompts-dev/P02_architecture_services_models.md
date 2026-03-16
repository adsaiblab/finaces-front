═══════════════════════════════════════════════════════════════════════════════
PROMPT 2 — ARCHITECTURE MODULES, SERVICES HTTP, MODÈLES TYPESCRIPT
═══════════════════════════════════════════════════════════════════════════════

**Dépend de:** PROMPT 1 (infrastructure, styles, tokens)
**Peut être parallélisé avec:** Aucun
**Livré à:** fin de ce prompt

---

## CONTEXTE

Le projet Angular est initialisé (P1) avec tous les styles, tokens et configuration. Ce prompt crée l'architecture complète de l'application:

1. **Services HTTP typés** — 8 services CoRE communicant avec FastAPI backend
2. **Modèles TypeScript** — Interfaces/classes alignées 100% avec schemas Swagger OAS 3.1
3. **Interceptors** — JWT injection, gestion d'erreurs 401
4. **Pipes partagés** — Transformation de données (currency, risk class)
5. **Structure de dossiers** — Respecte Angular best practices

À l'issue de ce prompt, tous les services HTTP sont **prêts à être appelés** depuis les composants. Les modèles garantissent **zéro `any` type** et une **100% type-safety**.

---

## RÈGLES MÉTIER APPLICABLES

**Aucune règle métier directement** — infrastructure uniquement.

**Contraintes techniques:**
- MCC-R7: Ratios must be calculated on normalized data only
- API base: `http://localhost:8000/api/v1` (from environment.ts)
- JWT token gestion: Bearer token injecté automatiquement
- Erreur 401: Trigger logout et redirection auth/login
- Timeout: 30s (configurable via environment)
- Case states machine: DRAFT → PENDING_GATE → ... → CLOSED (+ CANCELLED)

---

## FICHIERS À CRÉER / MODIFIER

### Services (8 fichiers):
1. `src/app/core/services/case.service.ts` — GET/POST/PATCH cases
2. `src/app/core/services/financial.service.ts` — Financials, normalize, ratios
3. `src/app/core/services/scoring.service.ts` — MCC scoring
4. `src/app/core/services/ia.service.ts` — IA predictions
5. `src/app/core/services/stress.service.ts` — Stress testing
6. `src/app/core/services/expert.service.ts` — Expert review
7. `src/app/core/services/document.service.ts` — Documents, gate
8. `src/app/core/services/consortium.service.ts` — Consortium calculation

### Interceptors (1 fichier):
9. `src/app/core/interceptors/jwt.interceptor.ts`

### Modèles (10 fichiers):
10. `src/app/core/models/case.model.ts`
11. `src/app/core/models/financial.model.ts`
12. `src/app/core/models/scoring.model.ts`
13. `src/app/core/models/ia.model.ts`
14. `src/app/core/models/stress.model.ts`
15. `src/app/core/models/expert.model.ts`
16. `src/app/core/models/document.model.ts`
17. `src/app/core/models/consortium.model.ts`
18. `src/app/core/models/index.ts` — barrel export

### Pipes (2 fichiers):
19. `src/app/shared/pipes/currency-format.pipe.ts`
20. `src/app/shared/pipes/risk-class-label.pipe.ts`

### Config (1 fichier):
21. `src/app/core/api.config.ts` — endpoints constants

**Total: ~21 fichiers**

---

## SPÉCIFICATION TECHNIQUE COMPLÈTE

### API ENDPOINTS REFERENCE

Tous les endpoints sont sous `/api/v1/`. Structure:

| Bloc | Action | Endpoint | Method | Input | Output |
|------|--------|----------|--------|-------|--------|
| 0 | Charger dossiers | `/cases` | GET | — | `EvaluationCaseOut[]` |
| 0 | Lister soumissionnaires | `/cases/bidders` | GET | — | `BidderOut[]` |
| 1A | Créer dossier | `/cases` | POST | `CaseCreate` | `EvaluationCaseDetailOut` |
| 1A | Voir dossier | `/cases/{id}` | GET | — | `EvaluationCaseDetailOut` |
| 1A | Voir statut | `/cases/{id}/status` | GET | — | `CaseStatusResponse` |
| 1A | Transitionner statut | `/cases/{id}/status` | PATCH | `StatusTransition` | `CaseStatusResponse` |
| 1B | Uploader document | `/cases/{id}/documents` | POST | `FormData + file` | `DocumentOut` |
| 1B | Lister documents | `/cases/{id}/documents` | GET | — | `DocumentOut[]` |
| 1B | Vérifier intégrité | `/cases/{id}/documents/{doc_id}/integrity` | GET | — | `IntegrityCheckResult` |
| 1B | Statut document | `/cases/documents/{doc_id}/status` | PATCH | `DocumentStatusUpdate` | — |
| 1B | Évaluer Gate | `/cases/{id}/gate/evaluate` | POST | — | `GateDecisionSchema` |
| 2 | Créer état financier | `/cases/{id}/financials` | POST | `FinancialStatementCreate` | `FinancialStatementRawOut` |
| 2 | Lire états financiers | `/cases/{id}/financials` | GET | — | `FinancialStatementRawOut[]` |
| 2 | Supprimer exercice | `/cases/{id}/financials/{stmt_id}` | DELETE | — | — |
| 3 | Lancer normalisation | `/cases/{id}/normalize` | POST | — | `FinancialStatementNormalizedSchema` |
| 4 | Calculer ratios | `/cases/{id}/ratios/compute` | POST | — | `RatioSetSchema` |
| 5 | Calculer score MCC | `/cases/{id}/score` | POST | — | `ScorecardOutputSchema` |
| 5 | Recommandation | `/cases/{id}/recommendation` | POST | `RecommendationUpdate` | — |
| 6 | Prédiction IA | Route ia.py | POST | `FeaturePayload` | `IAPredictionResult` |
| 8 | Stress test | `/cases/{id}/stress/run` | POST | `StressScenarioInputSchema` | `StressResultSchema` |
| 9 | Expert review | `/cases/{id}/experts/review` | POST | `ExpertReviewInputSchema` | `ExpertReviewOutputSchema` |
| 9 | Conclusion | `/cases/{id}/conclusion` | PATCH | `ConclusionUpdate` | — |
| CONS | Calculer consortium | `/cases/{id}/consortium/calculate` | POST | — | `ConsortiumScorecardOutput` |

---

### 1. MODÈLES TYPESCRIPT — CORE SCHEMAS

#### FILE: src/app/core/models/case.model.ts

```typescript
/**
 * CASE MODELS — Aligné avec Swagger OAS 3.1 backend schemas
 * Énums, DTOs, interfaces pour gestion des dossiers
 */

// ═══════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════

export enum CaseType {
  SINGLE = 'SINGLE',
  GROUPEMENT = 'GROUPEMENT',
  LOTS = 'LOTS',
}

export enum CaseStatus {
  DRAFT = 'DRAFT',
  PENDING_GATE = 'PENDING_GATE',
  FINANCIAL_INPUT = 'FINANCIAL_INPUT',
  NORMALIZATION_DONE = 'NORMALIZATION_DONE',
  RATIOS_COMPUTED = 'RATIOS_COMPUTED',
  SCORING_DONE = 'SCORING_DONE',
  STRESS_DONE = 'STRESS_DONE',
  EXPERT_REVIEWED = 'EXPERT_REVIEWED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum DocumentStatus {
  UPLOADED = 'UPLOADED',
  ANALYZED = 'ANALYZED',
  FLAGGED = 'FLAGGED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum GateVerdict {
  PASS = 'PASS',
  FAIL = 'FAIL',
  REVIEW = 'REVIEW',
}

// ═══════════════════════════════════════════════════════════
// INPUT DTOs
// ═══════════════════════════════════════════════════════════

export interface CaseCreate {
  name: string;
  bidder_name: string;
  country: string;
  sector: string;
  contract_value: number;
  contract_currency: string;
  contract_months: number;
  case_type: CaseType;
  case_manager_id?: string;
  notes?: string;
}

export interface StatusTransition {
  new_status: CaseStatus;
  reason?: string;
}

// ═══════════════════════════════════════════════════════════
// OUTPUT DTOs
// ═══════════════════════════════════════════════════════════

export interface EvaluationCaseOut {
  id: string;
  name: string;
  bidder_name: string;
  country: string;
  sector: string;
  contract_value: number;
  contract_currency: string;
  contract_months: number;
  case_type: CaseType;
  status: CaseStatus;
  created_at: string; // ISO 8601
  updated_at: string;
  created_by: string;
  case_manager_id?: string;
  mcc_score?: number;
  ia_score?: number;
  risk_class?: string;
  notes?: string;
}

export interface EvaluationCaseDetailOut extends EvaluationCaseOut {
  documents?: DocumentOut[];
  financial_statements?: FinancialStatementRawOut[];
  scorecard?: ScorecardOutputSchema;
  consortium_data?: ConsortiumMember[];
  expert_review?: ExpertReviewOutputSchema;
}

export interface CaseStatusResponse {
  case_id: string;
  current_status: CaseStatus;
  can_transition_to: CaseStatus[];
  last_transition_at: string;
  reason: string;
}

export interface BidderOut {
  id: string;
  name: string;
  country: string;
  sector: string;
  active_cases: number;
  last_evaluation_date?: string;
}

// ═══════════════════════════════════════════════════════════
// CONSORTIUM
// ═══════════════════════════════════════════════════════════

export interface ConsortiumMember {
  member_id: string;
  member_name: string;
  role: 'LEADER' | 'MEMBER';
  participation_pct: number;
}

export interface ConsortiumScorecardOutput {
  consortium_id: string;
  members: ConsortiumMember[];
  joint_venture_type: 'SOLIDAIRE' | 'CONJOINTE' | 'SEPARATE';
  synergy_index: number;
  weakest_member_id: string;
  combined_scorecard: ScorecardOutputSchema;
  member_scorecards: Record<string, ScorecardOutputSchema>;
}

export interface ConsortiumMemberCreate {
  member_id: string;
  role: 'LEADER' | 'MEMBER';
  participation_pct: number;
}

// ═══════════════════════════════════════════════════════════
// TYPE GUARDS
// ═══════════════════════════════════════════════════════════

export function isCaseStatus(value: any): value is CaseStatus {
  return Object.values(CaseStatus).includes(value);
}

export function isCaseType(value: any): value is CaseType {
  return Object.values(CaseType).includes(value);
}
```

#### FILE: src/app/core/models/financial.model.ts

```typescript
/**
 * FINANCIAL MODELS — Financials, normalization, ratios
 */

// ═══════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════

export enum AccountingStandard {
  IFRS = 'IFRS',
  LOCAL = 'LOCAL',
  USGAAP = 'USGAAP',
}

export enum CurrencyCode {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  XOF = 'XOF',
  XAF = 'XAF',
  ZAR = 'ZAR',
}

// ═══════════════════════════════════════════════════════════
// INPUT DTOs
// ═══════════════════════════════════════════════════════════

export interface FinancialStatementCreate {
  fiscal_year: number;
  closing_date: string; // ISO 8601
  accounting_standard: AccountingStandard;
  currency: CurrencyCode;
  revenue: number;
  cogs: number;
  gross_profit: number;
  ebitda: number;
  ebit: number;
  net_income: number;
  total_assets: number;
  current_assets: number;
  total_liabilities: number;
  current_liabilities: number;
  equity: number;
  cash: number;
  receivables: number;
  inventory: number;
  payables: number;
  short_term_debt: number;
  long_term_debt: number;
  depreciation_amortization: number;
  capex?: number;
  notes?: string;
}

// ═══════════════════════════════════════════════════════════
// OUTPUT DTOs
// ═══════════════════════════════════════════════════════════

export interface FinancialStatementRawOut {
  statement_id: string;
  case_id: string;
  fiscal_year: number;
  closing_date: string;
  accounting_standard: AccountingStandard;
  currency: CurrencyCode;
  revenue: number;
  cogs: number;
  gross_profit: number;
  ebitda: number;
  ebit: number;
  net_income: number;
  total_assets: number;
  current_assets: number;
  total_liabilities: number;
  current_liabilities: number;
  equity: number;
  cash: number;
  receivables: number;
  inventory: number;
  payables: number;
  short_term_debt: number;
  long_term_debt: number;
  depreciation_amortization: number;
  capex?: number;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface FinancialStatementNormalizedSchema {
  statement_id: string;
  fiscal_year: number;
  normalized_revenue: number;
  normalized_ebitda: number;
  normalized_net_income: number;
  normalized_working_capital: number;
  normalized_cash_flow: number;
  adjustments: NormalizationAdjustment[];
  confidence_score: number;
  normalization_date: string;
}

export interface NormalizationAdjustment {
  line_item: string;
  original_value: number;
  adjusted_value: number;
  reason: string;
  confidence: number;
}
```

#### FILE: src/app/core/models/scoring.model.ts

```typescript
/**
 * SCORING MODELS — MCC scoring, ratios, recommendations
 */

// ═══════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════

export enum RiskClass {
  FAIBLE = 'FAIBLE',
  MODERE = 'MODERE',
  ELEVE = 'ELEVE',
  CRITIQUE = 'CRITIQUE',
}

export enum PillarLabel {
  INSUFFISANT = 'INSUFFISANT',
  FAIBLE = 'FAIBLE',
  MODERE = 'MODERE',
  FORT = 'FORT',
  TRES_FORT = 'TRES_FORT',
}

export enum TensionLevel {
  NONE = 'NONE',
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
}

export enum RiskProfile {
  EQUILIBRE = 'EQUILIBRE',
  ASYMETRIQUE = 'ASYMETRIQUE',
  AGRESSIF = 'AGRESSIF',
  DEFENSIF = 'DEFENSIF',
  CLASSIQUE = 'CLASSIQUE',
}

// ═══════════════════════════════════════════════════════════
// RATIOS & DETAILED SCORES
// ═══════════════════════════════════════════════════════════

export interface RatioSetSchema {
  case_id: string;
  fiscal_year: number;
  // Liquidity ratios
  current_ratio: number;
  quick_ratio: number;
  cash_ratio: number;
  working_capital: number;
  bfr: number; // Besoin en fonds de roulement
  bfr_pct_ca: number;
  dso_days: number; // Days Sales Outstanding
  dpo_days: number; // Days Payable Outstanding
  // Solvency ratios
  debt_to_equity: number;
  gearing: number;
  debt_to_assets: number;
  equity_ratio: number;
  // Profitability ratios
  gross_margin: number;
  operating_margin: number;
  ebitda_margin: number;
  net_margin: number;
  roe: number; // Return on Equity
  roa: number; // Return on Assets
  roi: number; // Return on Investment
  roic: number; // Return on Invested Capital
  // Growth & efficiency
  cagr_revenue?: number;
  asset_turnover: number;
  equity_multiplier: number;
  // Altman Z-Score (EM 4-variable model)
  altman_zscore: number;
  altman_zscore_zone: 'SAFE' | 'GREY' | 'DISTRESS';
  // Computed at
  computed_at: string;
}

// ═══════════════════════════════════════════════════════════
// PILLAR DETAILS
// ═══════════════════════════════════════════════════════════

export interface PillarDetailSchema {
  pillar_name: string;
  score: number; // 0-5
  label: PillarLabel;
  ratios_used: string[];
  comment: string;
}

// ═══════════════════════════════════════════════════════════
// SCORECARD OUTPUT
// ═══════════════════════════════════════════════════════════

export interface ScorecardOutputSchema {
  case_id: string;
  scorecard_id: string;
  fiscal_year: number;
  // Five pillars
  liquidite_score: number;
  liquidite_label: PillarLabel;
  liquidite_detail: PillarDetailSchema;
  solvabilite_score: number;
  solvabilite_label: PillarLabel;
  solvabilite_detail: PillarDetailSchema;
  rentabilite_score: number;
  rentabilite_label: PillarLabel;
  rentabilite_detail: PillarDetailSchema;
  capacite_score: number;
  capacite_label: PillarLabel;
  capacite_detail: PillarDetailSchema;
  qualite_score: number;
  qualite_label: PillarLabel;
  qualite_detail: PillarDetailSchema;
  // Aggregate
  global_score: number; // 0-5 weighted average
  risk_class: RiskClass;
  risk_profile: RiskProfile;
  // Tension with IA
  ia_score?: number;
  tension_level?: TensionLevel;
  tension_comment?: string;
  // Expert
  expert_comment?: string;
  expert_reviewed_at?: string;
  expert_reviewed_by?: string;
  // Metadata
  created_at: string;
  computed_at: string;
  version: string;
  overrides?: OverrideRecord[];
}

export interface OverrideRecord {
  original_score: number;
  adjusted_score: number;
  override_type: string;
  justification: string;
  authorized_by: string;
  applied_at: string;
}

// ═══════════════════════════════════════════════════════════
// RECOMMENDATION
// ═══════════════════════════════════════════════════════════

export interface RecommendationUpdate {
  recommendation: string;
  conditions?: string[];
  risk_factors?: string[];
}
```

#### FILE: src/app/core/models/ia.model.ts

```typescript
/**
 * IA MODELS — AI/ML predictions, SHAP, what-if scenarios
 */

// ═══════════════════════════════════════════════════════════
// IA PREDICTION OUTPUT
// ═══════════════════════════════════════════════════════════

export interface IAPredictionResult {
  case_id: string;
  model_version: string;
  prediction_timestamp: string;
  predicted_score: number; // 0-5
  predicted_risk_class: string;
  confidence_interval: {
    lower: number;
    upper: number;
  };
  model_performance: {
    auc_roc: number;
    accuracy: number;
    f1_score: number;
  };
  shap_values: ShapExplanation;
  feature_importance: FeatureImportance[];
  disclaimer: string; // Mandated by MCC-R3
}

// ═══════════════════════════════════════════════════════════
// SHAP EXPLANATION
// ═══════════════════════════════════════════════════════════

export interface ShapExplanation {
  base_value: number;
  features: ShapFeature[];
  total_contribution: number;
}

export interface ShapFeature {
  feature_name: string;
  feature_value: number | string;
  shap_value: number; // Contribution to prediction
  direction: 'positive' | 'negative'; // Push score up or down
  magnitude: number; // Absolute importance
}

// ═══════════════════════════════════════════════════════════
// FEATURE IMPORTANCE
// ═══════════════════════════════════════════════════════════

export interface FeatureImportance {
  rank: number;
  feature_name: string;
  importance_score: number; // 0-100
  correlation_with_target: number;
}

// ═══════════════════════════════════════════════════════════
// WHAT-IF SCENARIOS (future)
// ═══════════════════════════════════════════════════════════

export interface WhatIfScenario {
  scenario_name: string;
  feature_modifications: Record<string, number>;
  predicted_score_if?: number;
  predicted_class_if?: string;
}
```

#### FILE: src/app/core/models/stress.model.ts

```typescript
/**
 * STRESS TEST MODELS — Scenario inputs, results, flows
 */

// ═══════════════════════════════════════════════════════════
// STRESS SCENARIO INPUT
// ═══════════════════════════════════════════════════════════

export interface StressScenarioInputSchema {
  revenue_shock: number; // % change
  cost_inflation: number; // %
  receivables_days_increase: number; // days
  payment_delays_days: number; // days
  interest_rate_increase: number; // basis points
  capex_reduction: number; // %
  initial_cash: number;
  scenario_name: string;
}

// ═══════════════════════════════════════════════════════════
// PAYMENT MILESTONE
// ═══════════════════════════════════════════════════════════

export interface PaymentMilestoneSchema {
  milestone_id: string;
  due_date: string; // ISO 8601
  amount: number;
  status: 'SCHEDULED' | 'PAID' | 'DELAYED' | 'OVERDUE';
  days_overdue?: number;
}

// ═══════════════════════════════════════════════════════════
// SCENARIO FLOW
// ═══════════════════════════════════════════════════════════

export interface ScenarioFlowSchema {
  date: string; // ISO 8601
  revenue: number;
  costs: number;
  receivables_balance: number;
  payables_balance: number;
  cash_balance: number;
  working_capital: number;
  debt_service_due: number;
}

// ═══════════════════════════════════════════════════════════
// STRESS RESULT
// ═══════════════════════════════════════════════════════════

export interface StressResultSchema {
  case_id: string;
  scenario_name: string;
  result_id: string;
  // Summary
  solvency_status: 'SOLVENT' | 'LIMIT' | 'INSOLVENT';
  minimum_cash_position: number;
  minimum_cash_date: string;
  days_to_default?: number;
  // Flows
  flows: ScenarioFlowSchema[];
  payment_milestones: PaymentMilestoneSchema[];
  // Risk metrics
  liquidity_coverage_ratio: number;
  debt_service_coverage_ratio: number;
  // Computed
  computed_at: string;
  duration_days: number;
}
```

#### FILE: src/app/core/models/expert.model.ts

```typescript
/**
 * EXPERT MODELS — Expert review, conclusions
 */

// ═══════════════════════════════════════════════════════════
// EXPERT REVIEW INPUT
// ═══════════════════════════════════════════════════════════

export interface ExpertReviewInputSchema {
  liquidity_comment: string;
  solvability_comment: string;
  profitability_comment: string;
  capacity_comment: string;
  quality_comment: string;
  dynamic_analysis_comment: string;
  mitigating_factors?: string;
  risk_factors?: string;
  override_recommendation?: string;
}

// ═══════════════════════════════════════════════════════════
// EXPERT REVIEW OUTPUT
// ═══════════════════════════════════════════════════════════

export interface ExpertReviewOutputSchema {
  case_id: string;
  review_id: string;
  expert_id: string;
  expert_name: string;
  reviewed_at: string;
  // Captured opinions
  liquidity_comment: string;
  solvability_comment: string;
  profitability_comment: string;
  capacity_comment: string;
  quality_comment: string;
  dynamic_analysis_comment: string;
  mitigating_factors?: string;
  risk_factors?: string;
  override_recommendation?: string;
  // Approval
  approved: boolean;
  approved_at?: string;
}

// ═══════════════════════════════════════════════════════════
// CONCLUSION UPDATE
// ═══════════════════════════════════════════════════════════

export interface ConclusionUpdate {
  conclusion_text: string;
  final_recommendation: string;
  conditional_factors?: string[];
}
```

#### FILE: src/app/core/models/document.model.ts

```typescript
/**
 * DOCUMENT MODELS — Document management, gate
 */

// ═══════════════════════════════════════════════════════════
// DOCUMENT OUT
// ═══════════════════════════════════════════════════════════

export interface DocumentOut {
  document_id: string;
  case_id: string;
  file_name: string;
  file_type: string; // MIME type
  file_size: number; // bytes
  status: 'UPLOADED' | 'ANALYZED' | 'FLAGGED' | 'APPROVED' | 'REJECTED';
  uploaded_at: string;
  uploaded_by: string;
  analyzed_at?: string;
  content_hash?: string;
  integrity_check_result?: string;
  notes?: string;
  scan_report?: ScanReport;
}

export interface ScanReport {
  scan_date: string;
  virus_detected: boolean;
  encryption_detected: boolean;
  anomalies: string[];
  is_valid: boolean;
}

// ═══════════════════════════════════════════════════════════
// DOCUMENT STATUS UPDATE
// ═══════════════════════════════════════════════════════════

export interface DocumentStatusUpdate {
  status: 'UPLOADED' | 'ANALYZED' | 'FLAGGED' | 'APPROVED' | 'REJECTED';
  notes?: string;
  analyst_comment?: string;
}

// ═══════════════════════════════════════════════════════════
// INTEGRITY CHECK
// ═══════════════════════════════════════════════════════════

export interface IntegrityCheckResult {
  document_id: string;
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  checked_at: string;
}

// ═══════════════════════════════════════════════════════════
// GATE DECISION
// ═══════════════════════════════════════════════════════════

export interface GateDecisionSchema {
  case_id: string;
  decision_id: string;
  verdict: 'PASS' | 'FAIL' | 'REVIEW';
  blocking_flags: string[];
  reserve_flags: string[];
  checked_documents: string[];
  missing_documents: string[];
  evaluation_date: string;
  evaluated_by: string;
  recommendation: string;
}
```

#### FILE: src/app/core/models/consortium.model.ts

```typescript
/**
 * CONSORTIUM MODELS — Already mostly in case.model.ts but consolidated here
 */

export interface ConsortiumScorecardOutput {
  consortium_id: string;
  members: ConsortiumMember[];
  joint_venture_type: 'SOLIDAIRE' | 'CONJOINTE' | 'SEPARATE';
  synergy_index: number; // 0-100
  weakest_member_id: string;
  combined_scorecard: any; // ScorecardOutputSchema
  member_scorecards: Record<string, any>;
  strength_ratio: number;
  recommendations: string[];
}

export interface ConsortiumMember {
  member_id: string;
  member_name: string;
  role: 'LEADER' | 'MEMBER';
  participation_pct: number;
  score?: number;
  risk_class?: string;
}
```

#### FILE: src/app/core/models/index.ts

Barrel export pour accès facile:

```typescript
/**
 * MODELS BARREL EXPORT
 * Import: import { CaseStatus, RiskClass, ... } from '@core/models';
 */

export * from './case.model';
export * from './financial.model';
export * from './scoring.model';
export * from './ia.model';
export * from './stress.model';
export * from './expert.model';
export * from './document.model';
export * from './consortium.model';
```

---

### 2. SERVICES HTTP

#### FILE: src/app/core/services/case.service.ts

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  CaseCreate,
  CaseStatus,
  EvaluationCaseOut,
  EvaluationCaseDetailOut,
  CaseStatusResponse,
  StatusTransition,
  BidderOut,
} from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class CaseService {
  private apiUrl = `${environment.apiUrl}/cases`;

  constructor(private http: HttpClient) {}

  /**
   * GET /cases — Charger tous les dossiers
   */
  getCases(): Observable<EvaluationCaseOut[]> {
    return this.http.get<EvaluationCaseOut[]>(this.apiUrl);
  }

  /**
   * GET /cases/{id} — Voir détail dossier
   */
  getCaseDetail(caseId: string): Observable<EvaluationCaseDetailOut> {
    return this.http.get<EvaluationCaseDetailOut>(`${this.apiUrl}/${caseId}`);
  }

  /**
   * POST /cases — Créer nouveau dossier
   */
  createCase(payload: CaseCreate): Observable<EvaluationCaseDetailOut> {
    return this.http.post<EvaluationCaseDetailOut>(this.apiUrl, payload);
  }

  /**
   * GET /cases/{id}/status — Voir statut actuel
   */
  getCaseStatus(caseId: string): Observable<CaseStatusResponse> {
    return this.http.get<CaseStatusResponse>(`${this.apiUrl}/${caseId}/status`);
  }

  /**
   * PATCH /cases/{id}/status — Transitionner le statut
   */
  transitionStatus(
    caseId: string,
    payload: StatusTransition
  ): Observable<CaseStatusResponse> {
    return this.http.patch<CaseStatusResponse>(
      `${this.apiUrl}/${caseId}/status`,
      payload
    );
  }

  /**
   * GET /cases/bidders — Lister soumissionnaires
   */
  getBidders(): Observable<BidderOut[]> {
    return this.http.get<BidderOut[]>(`${this.apiUrl}/bidders`);
  }
}
```

#### FILE: src/app/core/services/financial.service.ts

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  FinancialStatementCreate,
  FinancialStatementRawOut,
  FinancialStatementNormalizedSchema,
  RatioSetSchema,
} from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class FinancialService {
  private apiUrl = `${environment.apiUrl}/cases`;

  constructor(private http: HttpClient) {}

  /**
   * POST /cases/{id}/financials — Créer état financier
   */
  createFinancialStatement(
    caseId: string,
    payload: FinancialStatementCreate
  ): Observable<FinancialStatementRawOut> {
    return this.http.post<FinancialStatementRawOut>(
      `${this.apiUrl}/${caseId}/financials`,
      payload
    );
  }

  /**
   * GET /cases/{id}/financials — Lire tous les états financiers
   */
  getFinancialStatements(caseId: string): Observable<FinancialStatementRawOut[]> {
    return this.http.get<FinancialStatementRawOut[]>(
      `${this.apiUrl}/${caseId}/financials`
    );
  }

  /**
   * DELETE /cases/{id}/financials/{stmt_id} — Supprimer exercice
   */
  deleteFinancialStatement(
    caseId: string,
    statementId: string
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${caseId}/financials/${statementId}`
    );
  }

  /**
   * POST /cases/{id}/normalize — Lancer normalisation
   */
  normalizeFinancials(
    caseId: string
  ): Observable<FinancialStatementNormalizedSchema> {
    return this.http.post<FinancialStatementNormalizedSchema>(
      `${this.apiUrl}/${caseId}/normalize`,
      {}
    );
  }

  /**
   * POST /cases/{id}/ratios/compute — Calculer ratios financiers
   */
  computeRatios(caseId: string): Observable<RatioSetSchema> {
    return this.http.post<RatioSetSchema>(
      `${this.apiUrl}/${caseId}/ratios/compute`,
      {}
    );
  }
}
```

#### FILE: src/app/core/services/scoring.service.ts

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ScorecardOutputSchema,
  RecommendationUpdate,
} from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class ScoringService {
  private apiUrl = `${environment.apiUrl}/cases`;

  constructor(private http: HttpClient) {}

  /**
   * POST /cases/{id}/score — Calculer score MCC
   */
  computeScore(caseId: string): Observable<ScorecardOutputSchema> {
    return this.http.post<ScorecardOutputSchema>(
      `${this.apiUrl}/${caseId}/score`,
      {}
    );
  }

  /**
   * POST /cases/{id}/recommendation — Soumettre recommandation
   */
  submitRecommendation(
    caseId: string,
    payload: RecommendationUpdate
  ): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/${caseId}/recommendation`,
      payload
    );
  }
}
```

#### FILE: src/app/core/services/ia.service.ts

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { IAPredictionResult } from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class IaService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * POST /ia/cases/{id}/predict — Prédiction IA
   * Route sur ia.py backend
   */
  predictIA(caseId: string, features: Record<string, any>): Observable<IAPredictionResult> {
    return this.http.post<IAPredictionResult>(
      `${this.apiUrl}/ia/cases/${caseId}/predict`,
      features
    );
  }
}
```

#### FILE: src/app/core/services/stress.service.ts

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  StressScenarioInputSchema,
  StressResultSchema,
} from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class StressService {
  private apiUrl = `${environment.apiUrl}/cases`;

  constructor(private http: HttpClient) {}

  /**
   * POST /cases/{id}/stress/run — Exécuter stress test
   */
  runStressTest(
    caseId: string,
    payload: StressScenarioInputSchema
  ): Observable<StressResultSchema> {
    return this.http.post<StressResultSchema>(
      `${this.apiUrl}/${caseId}/stress/run`,
      payload
    );
  }
}
```

#### FILE: src/app/core/services/expert.service.ts

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ExpertReviewInputSchema,
  ExpertReviewOutputSchema,
  ConclusionUpdate,
} from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class ExpertService {
  private apiUrl = `${environment.apiUrl}/cases`;

  constructor(private http: HttpClient) {}

  /**
   * POST /cases/{id}/experts/review — Expert review
   */
  submitExpertReview(
    caseId: string,
    payload: ExpertReviewInputSchema
  ): Observable<ExpertReviewOutputSchema> {
    return this.http.post<ExpertReviewOutputSchema>(
      `${this.apiUrl}/${caseId}/experts/review`,
      payload
    );
  }

  /**
   * PATCH /cases/{id}/conclusion — Enregistrer conclusion
   */
  submitConclusion(
    caseId: string,
    payload: ConclusionUpdate
  ): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/${caseId}/conclusion`,
      payload
    );
  }
}
```

#### FILE: src/app/core/services/document.service.ts

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  DocumentOut,
  DocumentStatusUpdate,
  GateDecisionSchema,
  IntegrityCheckResult,
} from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class DocumentService {
  private apiUrl = `${environment.apiUrl}/cases`;

  constructor(private http: HttpClient) {}

  /**
   * POST /cases/{id}/documents — Uploader document
   */
  uploadDocument(caseId: string, file: File): Observable<DocumentOut> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<DocumentOut>(
      `${this.apiUrl}/${caseId}/documents`,
      formData
    );
  }

  /**
   * GET /cases/{id}/documents — Lister documents
   */
  getDocuments(caseId: string): Observable<DocumentOut[]> {
    return this.http.get<DocumentOut[]>(
      `${this.apiUrl}/${caseId}/documents`
    );
  }

  /**
   * GET /cases/{id}/documents/{doc_id}/integrity — Vérifier intégrité
   */
  checkIntegrity(
    caseId: string,
    docId: string
  ): Observable<IntegrityCheckResult> {
    return this.http.get<IntegrityCheckResult>(
      `${this.apiUrl}/${caseId}/documents/${docId}/integrity`
    );
  }

  /**
   * PATCH /cases/documents/{doc_id}/status — Mettre à jour statut doc
   */
  updateDocumentStatus(
    docId: string,
    payload: DocumentStatusUpdate
  ): Observable<void> {
    return this.http.patch<void>(
      `${this.apiUrl}/documents/${docId}/status`,
      payload
    );
  }

  /**
   * POST /cases/{id}/gate/evaluate — Évaluer gate
   */
  evaluateGate(caseId: string): Observable<GateDecisionSchema> {
    return this.http.post<GateDecisionSchema>(
      `${this.apiUrl}/${caseId}/gate/evaluate`,
      {}
    );
  }
}
```

#### FILE: src/app/core/services/consortium.service.ts

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ConsortiumScorecardOutput } from '@core/models';

@Injectable({
  providedIn: 'root',
})
export class ConsortiumService {
  private apiUrl = `${environment.apiUrl}/cases`;

  constructor(private http: HttpClient) {}

  /**
   * POST /cases/{id}/consortium/calculate — Calculer scorecard consortium
   */
  calculateConsortium(
    caseId: string
  ): Observable<ConsortiumScorecardOutput> {
    return this.http.post<ConsortiumScorecardOutput>(
      `${this.apiUrl}/${caseId}/consortium/calculate`,
      {}
    );
  }
}
```

---

### 3. INTERCEPTOR & PIPES

#### FILE: src/app/core/interceptors/jwt.interceptor.ts

```typescript
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '@core/services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Ajouter token Bearer si disponible
    const token = this.authService.getToken();
    if (token && !request.url.includes('login')) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Token expiré ou invalide → logout et redirection
          this.authService.logout();
          this.router.navigate(['/auth/login']);
        }
        return throwError(() => error);
      })
    );
  }
}
```

#### FILE: src/app/shared/pipes/currency-format.pipe.ts

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'currencyFormat',
  standalone: true,
})
export class CurrencyFormatPipe implements PipeTransform {
  transform(value: number, currency: string = 'USD', locale: string = 'en-US'): string {
    if (value === null || value === undefined) return '—';
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    } catch (e) {
      return `${value.toLocaleString(locale)} ${currency}`;
    }
  }
}
```

#### FILE: src/app/shared/pipes/risk-class-label.pipe.ts

```typescript
import { Pipe, PipeTransform } from '@angular/core';
import { RiskClass } from '@core/models';

@Pipe({
  name: 'riskClassLabel',
  standalone: true,
})
export class RiskClassLabelPipe implements PipeTransform {
  private readonly labelMap: Record<RiskClass | string, string> = {
    [RiskClass.FAIBLE]: 'Faible',
    [RiskClass.MODERE]: 'Modéré',
    [RiskClass.ELEVE]: 'Élevé',
    [RiskClass.CRITIQUE]: 'Critique',
  };

  transform(value: RiskClass | string | null): string {
    if (!value) return '—';
    return this.labelMap[value] || value;
  }
}
```

---

### 4. API CONFIG CONSTANTS

#### FILE: src/app/core/api.config.ts

```typescript
/**
 * API ENDPOINTS CONSTANTS
 * Centralized endpoint management
 */

export const API_ENDPOINTS = {
  CASES: {
    LIST: '/cases',
    CREATE: '/cases',
    GET: (id: string) => `/cases/${id}`,
    STATUS: (id: string) => `/cases/${id}/status`,
    TRANSITION: (id: string) => `/cases/${id}/status`,
  },
  FINANCIALS: {
    CREATE: (caseId: string) => `/cases/${caseId}/financials`,
    LIST: (caseId: string) => `/cases/${caseId}/financials`,
    DELETE: (caseId: string, stmtId: string) =>
      `/cases/${caseId}/financials/${stmtId}`,
    NORMALIZE: (caseId: string) => `/cases/${caseId}/normalize`,
    COMPUTE_RATIOS: (caseId: string) => `/cases/${caseId}/ratios/compute`,
  },
  SCORING: {
    COMPUTE: (caseId: string) => `/cases/${caseId}/score`,
    RECOMMEND: (caseId: string) => `/cases/${caseId}/recommendation`,
  },
  IA: {
    PREDICT: (caseId: string) => `/ia/cases/${caseId}/predict`,
  },
  STRESS: {
    RUN: (caseId: string) => `/cases/${caseId}/stress/run`,
  },
  EXPERT: {
    REVIEW: (caseId: string) => `/cases/${caseId}/experts/review`,
    CONCLUSION: (caseId: string) => `/cases/${caseId}/conclusion`,
  },
  DOCUMENTS: {
    UPLOAD: (caseId: string) => `/cases/${caseId}/documents`,
    LIST: (caseId: string) => `/cases/${caseId}/documents`,
    INTEGRITY: (caseId: string, docId: string) =>
      `/cases/${caseId}/documents/${docId}/integrity`,
    UPDATE_STATUS: (docId: string) => `/cases/documents/${docId}/status`,
    GATE_EVALUATE: (caseId: string) => `/cases/${caseId}/gate/evaluate`,
  },
  CONSORTIUM: {
    CALCULATE: (caseId: string) => `/cases/${caseId}/consortium/calculate`,
  },
};
```

---

### 5. AUTH SERVICE STUB

#### FILE: src/app/core/services/auth.service.ts

```typescript
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'finaces_token';

  /**
   * Stocker token après login
   */
  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  /**
   * Récupérer token depuis localStorage
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Vérifier si utilisateur est authentifié
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Logout
   */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}
```

---

## CONTRAINTES ANGULAR

**Injection HTTP:**
```typescript
// Dans app.config.ts:
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([jwtInterceptor])
    ),
  ],
};
```

**Standalone components:** Toutes les services déclarées `providedIn: 'root'`
**Types stricts:** Aucun `any`, tous les services retournent `Observable<T>`
**Error handling:** À implémenter dans les composants (subscribe + error callback)

---

## BINDING API

**Service HTTP → Composant:**
```typescript
// Dans un composant standalone:
constructor(private caseService: CaseService) {}

getCases() {
  this.caseService.getCases().subscribe({
    next: (cases) => { /* typed as EvaluationCaseOut[] */ },
    error: (err) => { /* handle error */ },
  });
}
```

**Modèles TypeScript → Templates:**
```html
<!-- Type-safe binding -->
<div [ngIf]="(case | async) as caseData">
  <p>{{ caseData.name }}</p>
  <p>{{ caseData.contract_value | currencyFormat: caseData.contract_currency }}</p>
  <p>{{ caseData.risk_class | riskClassLabel }}</p>
</div>
```

---

## CRITÈRES DE VALIDATION

À la fin de ce prompt, vérifier:

✓ `npm run build` réussit sans erreur
✓ Tous les services compilent sans error TS
✓ Pas de `any` types dans les modèles
✓ Les modèles correspondent 100% aux schemas Swagger
✓ Interceptor injecte Bearer token sur chaque requête
✓ Services returnent `Observable<T>` typés
✓ Pipes transforment correctement les données
✓ Import barrel `@core/models` fonctionne
✓ Aucune dépendance circulaire
✓ Tous les endpoints API sont couverts

---

## FICHIERS LIVRÉS À LA FIN DE CE PROMPT

Total: **21 fichiers** créés

```
src/app/core/
├── services/
│   ├── case.service.ts ..................... CRUD dossiers
│   ├── financial.service.ts ............... Financials + normalize + ratios
│   ├── scoring.service.ts ................. MCC scoring + recommendation
│   ├── ia.service.ts ...................... IA predictions
│   ├── stress.service.ts .................. Stress testing
│   ├── expert.service.ts .................. Expert review + conclusion
│   ├── document.service.ts ................ Documents + gate
│   ├── consortium.service.ts .............. Consortium calculation
│   └── auth.service.ts .................... Auth stub
├── interceptors/
│   └── jwt.interceptor.ts ................. Bearer token injection
├── models/
│   ├── case.model.ts ...................... Case DTOs + enums
│   ├── financial.model.ts ................. Financial DTOs
│   ├── scoring.model.ts ................... Scoring DTOs
│   ├── ia.model.ts ........................ IA DTOs
│   ├── stress.model.ts .................... Stress DTOs
│   ├── expert.model.ts .................... Expert DTOs
│   ├── document.model.ts .................. Document DTOs
│   ├── consortium.model.ts ................ Consortium DTOs
│   └── index.ts ........................... Barrel export
├── api.config.ts .......................... Endpoint constants
└── guards/ (empty stubs — P20)
    └── (will be created in PROMPT 20)
src/app/shared/
└── pipes/
    ├── currency-format.pipe.ts ............ Currency formatting
    └── risk-class-label.pipe.ts .......... Risk class labels
```

---

## PROCHAINES ÉTAPES

Passez à **PROMPT 3** (P03_app_shell_routing.md) pour:
- Créer App Shell (Topbar + Sidebar)
- Configurer routing complet
- Créer placeholders des features
- Router-outlet setup

