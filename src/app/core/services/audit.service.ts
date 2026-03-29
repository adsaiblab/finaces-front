// ═══════════════════════════════════════════════════════════════
// T43 — AuditService: trail, events, stats, CSV export
// ═══════════════════════════════════════════════════════════════
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuditEvent, AuditStats, AuditTrailParams } from '../models/audit.model';

@Injectable({
  providedIn: 'root',
})
export class AuditService {
  private readonly http = inject(HttpClient);
  private readonly auditUrl = `${environment.apiUrl}/audit`;

  private readonly handleError = (error: HttpErrorResponse): Observable<never> => {
    if (!environment.production) {
      console.error('AuditService API Error:', error);
    }
    return throwError(() => new Error(error.error?.detail || error.message || 'Server Error'));
  };

  /**
   * GET /audit/events
   * Returns recent audit events with optional filtering.
   */
  getEvents(params?: {
    limit?: number;
    case_id?: string;
    event_type?: string;
  }): Observable<AuditEvent[]> {
    let httpParams = new HttpParams();
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.case_id) httpParams = httpParams.set('case_id', params.case_id);
    if (params?.event_type) httpParams = httpParams.set('event_type', params.event_type);
    return this.http
      .get<AuditEvent[]>(`${this.auditUrl}/events`, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  /**
   * GET /audit/trail
   * Returns paginated, filtered audit trail.
   */
  getTrail(params?: AuditTrailParams): Observable<AuditEvent[]> {
    let httpParams = new HttpParams();
    if (params?.case_id) httpParams = httpParams.set('case_id', params.case_id);
    if (params?.event_type) httpParams = httpParams.set('event_type', params.event_type);
    if (params?.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params?.offset) httpParams = httpParams.set('offset', params.offset.toString());
    return this.http
      .get<AuditEvent[]>(`${this.auditUrl}/trail`, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  /**
   * GET /audit/stats
   * Returns aggregated audit statistics (optionally per case).
   */
  getStats(caseId?: string): Observable<AuditStats> {
    let httpParams = new HttpParams();
    if (caseId) httpParams = httpParams.set('case_id', caseId);
    return this.http
      .get<AuditStats>(`${this.auditUrl}/stats`, { params: httpParams })
      .pipe(catchError(this.handleError));
  }

  /**
   * GET /audit/export/csv
   * Downloads the audit trail as CSV (Blob).
   */
  exportCsv(caseId?: string): Observable<Blob> {
    let httpParams = new HttpParams();
    if (caseId) httpParams = httpParams.set('case_id', caseId);
    return this.http
      .get(`${this.auditUrl}/export/csv`, {
        params: httpParams,
        responseType: 'blob',
      })
      .pipe(catchError(this.handleError));
  }
}
