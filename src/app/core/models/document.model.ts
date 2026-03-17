export interface DocumentOut {
    document_id: string;
    case_id: string;
    file_name: string;
    file_type: string;
    file_size: number;
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

export interface DocumentStatusUpdate {
    status: 'UPLOADED' | 'ANALYZED' | 'FLAGGED' | 'APPROVED' | 'REJECTED';
    notes?: string;
    analyst_comment?: string;
}

export interface IntegrityCheckResult {
    document_id: string;
    is_valid: boolean;
    errors: string[];
    warnings: string[];
    checked_at: string;
}

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