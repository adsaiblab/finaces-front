import { GateVerdict, ReliabilityLevel, DocType, DocStatus } from './enums';

export interface GateDecisionOut {
  id: string;
  case_id: string;
  verdict: GateVerdict;
  reliability_level: ReliabilityLevel;
  missing_docs: string[];
  computed_at: string;
}

export interface GateDocumentOut {
  id: string;
  case_id: string;
  doc_type: DocType;
  reliability_level: ReliabilityLevel;
  status: DocStatus;
  filename: string;
  file_size_kb: number;
  uploaded_at: string;
  red_flags?: string[];
}

// Legacy types for backward compatibility
export type DocumentDocType = 'BILAN' | 'CPC' | 'TFT' | 'ATTESTATION_FISCALE' | 'STATUTS' | 'OTHER';
export type IntegrityStatus = 'OK' | 'WARN' | 'KO';

export interface DocumentIntegrityResult {
  doc_id: string;
  is_valid: boolean;
  hash_match: boolean;
  virus_scan: 'CLEAN' | 'INFECTED' | 'PENDING';
  checked_at: string;
}

export interface AuditLogEntry {
  timestamp: string;
  actor: string;
  action: string;
  details: string;
}

export interface GateDecisionSchema {
  id: string;
  case_id: string;
  is_passed: boolean;
  verdict: GateVerdict;
  reliability_score: number;
  reliability_level: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
  blocking_reasons: string[];
  reserve_flags: string[];
  missing_docs: string[];
  missing_mandatory?: string[];
  missing_optional?: string[];
  documents_received: Record<string, number[]>;
  audit_log: AuditLogEntry[];
  evaluated_at: string;
  evaluated_by: string;
}
