// ═══════════════════════════════════════════════════════════════
// T41 + T42 — ReportService: build, get, update sections, export
// ═══════════════════════════════════════════════════════════════
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MCCGradeReportOut, ReportSectionUpdate, ExportResult } from '../models/report.model';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly casesUrl = `${environment.apiUrl}/cases`;
  private readonly exportUrl = `${environment.apiUrl}/cases`;

  private readonly handleError = (error: HttpErrorResponse): Observable<never> => {
    if (!environment.production) {
      console.error('ReportService API Error:', error);
    }
    return throwError(() => new Error(error.error?.detail || error.message || 'Server Error'));
  };

  // ─── T41: Build report ───────────────────────────────────
  /**
   * POST /cases/{caseId}/report/build
   * Generates the full 14-section MCC-grade report (server-side).
   */
  buildReport(caseId: string): Observable<MCCGradeReportOut> {
    return this.http
      .post<MCCGradeReportOut>(`${this.casesUrl}/${caseId}/report/build`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * GET /cases/{caseId}/report
   * Retrieves the most recent report for a case.
   */
  getReport(caseId: string): Observable<MCCGradeReportOut> {
    return this.http
      .get<MCCGradeReportOut>(`${this.casesUrl}/${caseId}/report`)
      .pipe(catchError(this.handleError));
  }

  /**
   * PUT /cases/{caseId}/report/{reportId}/section
   * Updates a single section of the report.
   */
  updateSection(
    caseId: string,
    reportId: string,
    payload: ReportSectionUpdate,
  ): Observable<{ status: string }> {
    return this.http
      .put<{ status: string }>(`${this.casesUrl}/${caseId}/report/${reportId}/section`, payload)
      .pipe(catchError(this.handleError));
  }

  /**
   * POST /{reportId}/finalize
   * Marks the report as FINAL (read-only).
   */
  finalizeReport(caseId: string, reportId: string): Observable<{ status: string }> {
    return this.http
      .post<{ status: string }>(`${this.casesUrl}/${caseId}/report/${reportId}/finalize`, {})
      .pipe(catchError(this.handleError));
  }

  // ─── T42: Export Word / PDF ──────────────────────────────
  /**
   * POST /cases/{caseId}/export/word
   * Triggers server-side Word document generation.
   * Returns metadata with download_url.
   */
  exportWord(caseId: string): Observable<ExportResult> {
    return this.http
      .post<ExportResult>(`${this.exportUrl}/${caseId}/export/word`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * POST /cases/{caseId}/export/pdf
   * Triggers server-side PDF generation (with HTML fallback).
   * Returns metadata with download_url.
   */
  exportPdf(caseId: string): Observable<ExportResult> {
    return this.http
      .post<ExportResult>(`${this.exportUrl}/${caseId}/export/pdf`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * GET /cases/{caseId}/export/word/download
   * Downloads the generated Word file as a Blob.
   */
  downloadWord(caseId: string): Observable<Blob> {
    return this.http
      .get(`${this.exportUrl}/${caseId}/export/word/download`, {
        responseType: 'blob',
      })
      .pipe(catchError(this.handleError));
  }

  /**
   * GET /cases/{caseId}/export/pdf/download
   * Downloads the generated PDF file as a Blob.
   */
  downloadPdf(caseId: string): Observable<Blob> {
    return this.http
      .get(`${this.exportUrl}/${caseId}/export/pdf/download`, {
        responseType: 'blob',
      })
      .pipe(catchError(this.handleError));
  }
}
