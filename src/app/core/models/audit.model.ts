// ═══════════════════════════════════════════════════════════════
// T43 — Audit trail models for /api/v1/audit/*
// ═══════════════════════════════════════════════════════════════

export interface AuditEvent {
  id: string;
  case_id: string | null;
  event_type: string;
  entity_type: string | null;
  entity_id: string | null;
  description: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  user_id: string | null;
  session_id: string | null;
  duration_ms: number | null;
  created_at: string;

  // UI enrichment (from get_case_timeline)
  icon?: string;
  color?: string;
  section?: string;
}

export interface AuditStats {
  total_events: number;
  counts_by_type: Record<string, number>;
  error_count: number;
  last_event_at: string | null;
  last_event_type: string | null;
  unique_event_types: number;
}

export interface AuditTrailParams {
  case_id?: string;
  event_type?: string;
  limit?: number;
  offset?: number;
}

/** Event type constants for filtering */
export const AUDIT_EVENT_TYPES = {
  // Case
  CASE_CREATED: 'CASE_CREATED',
  CASE_UPDATED: 'CASE_UPDATED',
  CASE_STATUS_CHANGED: 'CASE_STATUS_CHANGED',
  // Gate
  GATE_COMPUTED: 'GATE_COMPUTED',
  DOCUMENT_ADDED: 'DOCUMENT_ADDED',
  // Financial
  FINANCIAL_CREATED: 'FINANCIAL_CREATED',
  NORMALIZATION_SAVED: 'NORMALIZATION_SAVED',
  // Analysis
  RATIO_COMPUTED: 'RATIO_COMPUTED',
  STRESS_TEST_COMPUTED: 'STRESS_TEST_COMPUTED',
  // Scoring
  SCORECARD_COMPUTED: 'SCORECARD_COMPUTED',
  OVERRIDE_ADDED: 'OVERRIDE_ADDED',
  EXPERT_REVIEW_SUBMITTED: 'EXPERT_REVIEW_SUBMITTED',
  // Report
  REPORT_GENERATED: 'REPORT_GENERATED',
  REPORT_SECTION_UPDATED: 'REPORT_SECTION_UPDATED',
  REPORT_FINALIZED: 'REPORT_FINALIZED',
  REPORT_EXPORTED: 'REPORT_EXPORTED',
  // System
  SYSTEM_ERROR: 'SYSTEM_ERROR',
} as const;

/** Section grouping for timeline UI */
export const AUDIT_SECTION_GROUPS: Record<string, string[]> = {
  Dossier: ['CASE_CREATED', 'CASE_UPDATED', 'CASE_STATUS_CHANGED', 'CASE_DELETED'],
  Gate: ['GATE_COMPUTED', 'DD_CHECK_SAVED', 'DOCUMENT_ADDED', 'DOCUMENT_UPDATED'],
  Financiers: [
    'FINANCIAL_CREATED',
    'FINANCIAL_UPDATED',
    'FINANCIAL_STATEMENT_SAVED',
    'NORMALIZATION_SAVED',
    'ADJUSTMENT_ADDED',
  ],
  Analyse: ['RATIO_COMPUTED', 'INTERPRETATION_SAVED', 'STRESS_TEST_COMPUTED'],
  Scoring: [
    'SCORECARD_COMPUTED',
    'OVERRIDE_ADDED',
    'OVERRIDE_CANCELLED',
    'EXPERT_REVIEW_SUBMITTED',
  ],
  Rapport: ['REPORT_GENERATED', 'REPORT_SECTION_UPDATED', 'REPORT_FINALIZED'],
  Export: ['REPORT_EXPORTED', 'DATA_EXPORT'],
  System: ['SYSTEM_ERROR', 'POLICY_LOADED', 'SESSION_START'],
};
