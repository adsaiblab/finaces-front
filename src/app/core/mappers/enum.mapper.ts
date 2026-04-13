import { GateVerdict, DocType, RiskClass, CaseStatus } from '../models/enums';

export const GateVerdictDisplay: Record<GateVerdict, string> = {
  PASSED: 'Recevable',
  RESERVE: 'Sous réserve',
  BLOCKING: 'Bloquant',
};

export const DocTypeDisplay: Record<DocType, string> = {
  FINANCIAL_STATEMENTS: 'États financiers',
  AUDITOR_OPINION: 'Opinion commissaire',
  ANNEXES: 'Annexes',
  CA_DECLARATION: 'Déclaration CA',
  BANK_REFERENCES: 'Références bancaires',
  OTHER: 'Autre',
};

export const RiskClassDisplay: Record<RiskClass, string> = {
  LOW: 'Faible',
  MODERATE: 'Modéré',
  HIGH: 'Élevé',
  CRITICAL: 'Critique',
};

export const CaseStatusDisplay: Record<CaseStatus, string> = {
  DRAFT: 'Brouillon',
  PENDING_GATE: 'En attente Gate',
  FINANCIAL_INPUT: 'Saisie financière',
  NORMALIZATION_DONE: 'Normalisé',
  RATIOS_COMPUTED: 'Ratios calculés',
  SCORING_DONE: 'Scoré',
  STRESS_DONE: 'Stress testé',
  EXPERT_REVIEWED: 'Revue expert',
  CLOSED: 'Clôturé',
  ARCHIVED: 'Archivé',
};
