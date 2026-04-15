import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { NormalizationMapper } from '../mappers/normalization.mapper';
import {
  CaseCreate,
  EvaluationCaseOut,
  EvaluationCaseDetailOut,
  CaseStatusResponse,
  StatusTransition,
  DashboardStatsOut,
  ConvergenceChartOut,
  TensionAlertOut,
  GateDecisionSchema,
  FinancialStatementRawOut,
  FinancialStatementCreate,
  FinancialStatementNormalizedSchema,
  RatioSetGrouped,
} from '../models';

@Injectable({
  providedIn: 'root',
})
export class CaseService {
  private apiUrl = `${environment.apiUrl}/cases`;
  private analyticsUrl = `${environment.apiUrl}/ia/analytics`;
  private dashboardUrl = `${environment.apiUrl}/dashboard`;

  private readonly http = inject(HttpClient);

  private readonly handleError = (error: HttpErrorResponse): Observable<never> => {
    if (!environment.production) {
      console.error('CaseService API Error:', error);
    }
    return throwError(() => new Error(error.message || 'Server Error'));
  };

  getCases(): Observable<EvaluationCaseOut[]> {
    return this.http.get<EvaluationCaseOut[]>(this.apiUrl).pipe(catchError(this.handleError));
  }

  getCaseDetail(caseId: string): Observable<EvaluationCaseDetailOut> {
    return this.http
      .get<EvaluationCaseDetailOut>(`${this.apiUrl}/${caseId}`)
      .pipe(catchError(this.handleError));
  }

  createCase(payload: CaseCreate): Observable<EvaluationCaseDetailOut> {
    return this.http
      .post<EvaluationCaseDetailOut>(this.apiUrl, payload)
      .pipe(catchError(this.handleError));
  }

  saveCaseDraft(payload: Partial<CaseCreate>): Observable<EvaluationCaseDetailOut> {
    const draftPayload = { ...payload, status: 'DRAFT' };
    return this.http
      .post<EvaluationCaseDetailOut>(this.apiUrl, draftPayload)
      .pipe(catchError(this.handleError));
  }

  getCaseStatus(caseId: string): Observable<CaseStatusResponse> {
    return this.http
      .get<CaseStatusResponse>(`${this.apiUrl}/${caseId}/status`)
      .pipe(catchError(this.handleError));
  }

  transitionStatus(caseId: string, payload: StatusTransition): Observable<CaseStatusResponse> {
    return this.http
      .patch<CaseStatusResponse>(`${this.apiUrl}/${caseId}/status`, payload)
      .pipe(catchError(this.handleError));
  }

  getDashboardStats(): Observable<DashboardStatsOut> {
    return this.http
      .get<DashboardStatsOut>(`${this.dashboardUrl}/stats`)
      .pipe(catchError(this.handleError));
  }

  getRecentCases(limit: number = 5): Observable<EvaluationCaseDetailOut[]> {
    const params = new HttpParams().set('limit', limit.toString()).set('sort', '-updated_at');
    return this.http
      .get<EvaluationCaseDetailOut[]>(this.apiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  getConvergenceChart(days: number = 30): Observable<ConvergenceChartOut> {
    const params = new HttpParams().set('days', days.toString());
    return this.http
      .get<ConvergenceChartOut>(`${this.analyticsUrl}/convergence`, { params })
      .pipe(catchError(this.handleError));
  }

  getActiveTensionCases(): Observable<TensionAlertOut[]> {
    const params = new HttpParams().set('filter', 'divergence_level:MODERATE,SEVERE');
    return this.http
      .get<TensionAlertOut[]>(this.apiUrl, { params })
      .pipe(catchError(this.handleError));
  }

  evaluateGate(caseId: string): Observable<GateDecisionSchema> {
    return this.http
      .post<GateDecisionSchema>(`${this.apiUrl}/${caseId}/gate/evaluate`, null)
      .pipe(
        map(result => ({
          ...result,
          blocking_reasons:  result.blocking_reasons  ?? [],
          reserve_flags:     result.reserve_flags      ?? [],
          documents_received: (result as any).documents_received ?? {},
          audit_log:         (result as any).audit_log         ?? [],
        })),
        catchError(this.handleError)
      );
  }

  patchCaseStatus(
    caseId: string,
    transition: StatusTransition,
  ): Observable<EvaluationCaseDetailOut> {
    return this.http
      .patch<EvaluationCaseDetailOut>(`${this.apiUrl}/${caseId}/status`, transition)
      .pipe(catchError(this.handleError));
  }

  getFinancials(caseId: string): Observable<FinancialStatementRawOut[]> {
    return this.http
      .get<FinancialStatementRawOut[]>(`${this.apiUrl}/${caseId}/financials`)
      .pipe(catchError(this.handleError));
  }

  saveFinancials(
    caseId: string,
    data: FinancialStatementCreate,
  ): Observable<FinancialStatementRawOut> {
    return this.http
      .post<FinancialStatementRawOut>(`${this.apiUrl}/${caseId}/financials`, data)
      .pipe(catchError(this.handleError));
  }

  deleteFinancials(caseId: string, stmtId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${caseId}/financials/${stmtId}`)
      .pipe(catchError(this.handleError));
  }

  normalizeFinancials(caseId: string): Observable<FinancialStatementNormalizedSchema[]> {
    return this.http
      .post<Record<string, unknown>[]>(`${this.apiUrl}/${caseId}/normalize`, {})
      .pipe(
        map((data) => NormalizationMapper.fromBackendList(data)),
        catchError(this.handleError)
      );
  }

  getNormalizedFinancials(caseId: string): Observable<FinancialStatementNormalizedSchema[]> {
    return this.http
      .get<Record<string, unknown>[]>(`${this.apiUrl}/${caseId}/normalized-financials`)
      .pipe(
        map((data) => NormalizationMapper.fromBackendList(data)),
        catchError(this.handleError)
      );
  }

  computeRatios(caseId: string): Observable<RatioSetGrouped> {
    return this.http
      .post<RatioSetGrouped>(`${this.apiUrl}/${caseId}/ratios/compute`, {})
      .pipe(catchError(this.handleError));
  }
}
