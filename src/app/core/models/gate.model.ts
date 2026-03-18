export type DocumentDocType = 'BILAN' | 'CPC' | 'TFT' | 'ATTESTATION_FISCALE' | 'STATUTS' | 'OTHER';
export type ReliabilityLevel = 'AUDITED' | 'REVIEWED' | 'COMPILED' | 'UNAUDITED';
export type IntegrityStatus = 'OK' | 'WARN' | 'KO';

export interface GateDocumentOut {
    id: string;
    case_id: string;
    filename: string;
    original_filename: string;
    file_size: number;
    file_hash?: string;
    document_type: DocumentDocType;
    fiscal_year: number;
    reliability_level: ReliabilityLevel;
    auditor_name?: string;
    notes?: string;
    upload_status: string;
    integrity_status: IntegrityStatus;
    processing_status: string;
    red_flags: string[];
    uploaded_at: string;
    processed_at?: string;
    created_by?: string;
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
    verdict: 'PASSÉ' | 'BLOQUÉ' | 'EN ATTENTE';
    reliability_score: number;
    reliability_level: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
    blocking_reasons: string[];
    reserve_flags: string[];
    missing_docs: string[];
    documents_received: Record<string, number[]>;
    audit_log: AuditLogEntry[];
    evaluated_at: string;
    evaluated_by: string;
}