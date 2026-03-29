// ═══════════════════════════════════════════════════════════════
// T41 — Report models for POST /cases/{id}/report/build
// ═══════════════════════════════════════════════════════════════

export interface ReportSectionFlags {
  section_01_info: boolean;
  section_02_objective: boolean;
  section_03_scope: boolean;
  section_04_executive_summary: boolean;
  section_05_profile: boolean;
  section_06_analysis: boolean;
  section_07_capacity: boolean;
  section_08_red_flags: boolean;
  section_09_mitigants: boolean;
  section_10_scoring: boolean;
  section_11_assessment: boolean;
  section_12_recommendation: boolean;
  section_13_limitations: boolean;
  section_14_conclusion: boolean;
}

export interface MCCGradeReportOut {
  report_id: string;
  case_id: string;
  recommendation: string | null;
  version_number?: number;
  status: 'DRAFT' | 'FINAL';

  // 14 sections (markdown content)
  section_01_info: string | null;
  section_02_objective: string | null;
  section_03_scope: string | null;
  section_04_executive_summary: string | null;
  section_05_profile: string | null;
  section_06_analysis: string | null;
  section_07_capacity: string | null;
  section_08_red_flags: string | null;
  section_09_mitigants: string | null;
  section_10_scoring: string | null;
  section_11_assessment: string | null;
  section_12_recommendation: string | null;
  section_13_limitations: string | null;
  section_14_conclusion: string | null;

  // Tracking
  complete_flags: ReportSectionFlags;
  sections_complete: number;
  sections_total: number;

  // Export info (populated after export)
  export_word_path?: string | null;
  export_pdf_path?: string | null;

  created_at?: string;
  updated_at?: string;
}

export interface ReportSectionUpdate {
  section_key: string;
  content: string;
}

export interface ExportResult {
  status: string;
  format: string;
  case_id: string;
  report_id: string;
  file_path: string;
  download_url: string;
}

export const REPORT_SECTION_KEYS = [
  'section_01_info',
  'section_02_objective',
  'section_03_scope',
  'section_04_executive_summary',
  'section_05_profile',
  'section_06_analysis',
  'section_07_capacity',
  'section_08_red_flags',
  'section_09_mitigants',
  'section_10_scoring',
  'section_11_assessment',
  'section_12_recommendation',
  'section_13_limitations',
  'section_14_conclusion',
] as const;

export const REPORT_SECTION_LABELS: Record<string, string> = {
  section_01_info: '1. General Information',
  section_02_objective: '2. Purpose of the Report',
  section_03_scope: '3. Scope of Analysis',
  section_04_executive_summary: '4. Executive Summary',
  section_05_profile: '5. Bidder Profile',
  section_06_analysis: '6. Financial Analysis',
  section_07_capacity: '7. Contract Capacity',
  section_08_red_flags: '8. Red Flags',
  section_09_mitigants: '9. Mitigating Factors',
  section_10_scoring: '10. MCC-grade Scoring',
  section_11_assessment: '11. Risk Assessment',
  section_12_recommendation: '12. Recommendation',
  section_13_limitations: '13. Limitations',
  section_14_conclusion: '14. Conclusion',
};
