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