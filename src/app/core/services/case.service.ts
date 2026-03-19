import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    CaseCreate,
    CaseStatus,
    EvaluationCaseOut,
    EvaluationCaseDetailOut,
    CaseStatusResponse,
    StatusTransition,
    BidderOut,
    DashboardStatsOut,
    ConvergenceChartOut,
    TensionAlertOut,
    GateDecisionSchema,
    FinancialStatementRawOut,
    FinancialStatementCreate,
    FinancialStatementNormalizedSchema
} from '../models';

@Injectable({
    providedIn: 'root',
})
export class CaseService {
    private apiUrl = `${environment.apiUrl}/cases`;
    private analyticsUrl = `${environment.apiUrl}/analytics`;
    private dashboardUrl = `${environment.apiUrl}/dashboard`;

    constructor(private http: HttpClient) { }

    getCases(): Observable<EvaluationCaseOut[]> {
        return this.http.get<EvaluationCaseOut[]>(this.apiUrl);
    }

    getCaseDetail(caseId: string): Observable<EvaluationCaseDetailOut> {
        return this.http.get<EvaluationCaseDetailOut>(`${this.apiUrl}/${caseId}`);
    }

    createCase(payload: CaseCreate): Observable<EvaluationCaseDetailOut> {
        return this.http.post<EvaluationCaseDetailOut>(this.apiUrl, payload);
    }

    saveCaseDraft(payload: Partial<CaseCreate>): Observable<EvaluationCaseDetailOut> {
        const draftPayload = { ...payload, status: 'DRAFT' };
        return this.http.post<EvaluationCaseDetailOut>(this.apiUrl, draftPayload);
    }

    getCaseStatus(caseId: string): Observable<CaseStatusResponse> {
        return this.http.get<CaseStatusResponse>(`${this.apiUrl}/${caseId}/status`);
    }

    transitionStatus(
        caseId: string,
        payload: StatusTransition
    ): Observable<CaseStatusResponse> {
        return this.http.patch<CaseStatusResponse>(
            `${this.apiUrl}/${caseId}/status`,
            payload
        );
    }

    getBidders(): Observable<BidderOut[]> {
        return this.http.get<BidderOut[]>(`${this.apiUrl}/bidders`);
    }

    getDashboardStats(): Observable<DashboardStatsOut> {
        return this.http.get<DashboardStatsOut>(this.dashboardUrl);
    }

    getRecentCases(limit: number = 5): Observable<EvaluationCaseDetailOut[]> {
        const params = new HttpParams()
            .set('limit', limit.toString())
            .set('sort', '-updated_at');
        return this.http.get<EvaluationCaseDetailOut[]>(this.apiUrl, { params });
    }

    getConvergenceChart(days: number = 30): Observable<ConvergenceChartOut> {
        const params = new HttpParams().set('days', days.toString());
        return this.http.get<ConvergenceChartOut>(`${this.analyticsUrl}/convergence`, { params });
    }

    getActiveTensionCases(): Observable<TensionAlertOut[]> {
        const params = new HttpParams().set('filter', 'divergence_level:MODERATE,SEVERE');
        return this.http.get<TensionAlertOut[]>(this.apiUrl, { params });
    }

    evaluateGate(caseId: string): Observable<GateDecisionSchema> {
        return this.http.post<GateDecisionSchema>(
            `${this.apiUrl}/${caseId}/gate/evaluate`,
            {}
        );
    }

    patchCaseStatus(caseId: string, status: string): Observable<EvaluationCaseDetailOut> {
        return this.http.patch<EvaluationCaseDetailOut>(
            `${this.apiUrl}/${caseId}`,
            { status }
        );
    }

    // =========================================================================
    // NOUVELLES MÉTHODES POUR LES ÉTATS FINANCIERS (BLOC 2 & 3)
    // =========================================================================

    getFinancials(caseId: string): Observable<FinancialStatementRawOut[]> {
        return this.http.get<FinancialStatementRawOut[]>(`${this.apiUrl}/${caseId}/financials`);
    }

    saveFinancials(caseId: string, data: FinancialStatementCreate): Observable<FinancialStatementRawOut> {
        return this.http.post<FinancialStatementRawOut>(`${this.apiUrl}/${caseId}/financials`, data);
    }

    deleteFinancials(caseId: string, stmtId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${caseId}/financials/${stmtId}`);
    }

    normalizeFinancials(caseId: string): Observable<FinancialStatementNormalizedSchema> {
        return this.http.post<FinancialStatementNormalizedSchema>(`${this.apiUrl}/${caseId}/normalize`, {});
    }
}