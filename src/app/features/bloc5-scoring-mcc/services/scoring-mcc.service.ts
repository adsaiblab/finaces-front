import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ScoringMccSchema, ScoreOverridePayload } from '../../../core/models/scoring.model';

@Injectable({
  providedIn: 'root',
})
export class ScoringMccService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/cases`;

  /**
   * GET: Retrieves an already calculated scorecard from the database.
   * Returns 404 (handled by component) if not yet calculated.
   */
  public getExistingScoring(caseId: string): Observable<ScoringMccSchema> {
    return this.http.get<ScoringMccSchema>(`${this.apiUrl}/${caseId}/score`).pipe(
      tap((result) => console.log('✅ [Scoring MCC] Existing data found:', result)),
      catchError((err) => {
        // We don't log error here as 404 is a valid scenario for "not yet computed"
        return throwError(() => err);
      }),
    );
  }

  /**
   * POST: Triggers the heavy AI/ML scoring pipeline on the backend.
   */
  public computeScoring(caseId: string): Observable<ScoringMccSchema> {
    return this.http.post<ScoringMccSchema>(`${this.apiUrl}/${caseId}/score`, {}).pipe(
      tap((result) => console.warn('✅ [Scoring MCC] Computed successfully:', result)),
      catchError((err) => {
        console.error('❌ [Scoring MCC] Computation error:', err);
        return throwError(() => err);
      }),
    );
  }

  /**
   * POST: Applies a manual override to the risk class.
   */
  public overrideScore(
    caseId: string,
    payload: ScoreOverridePayload,
  ): Observable<ScoringMccSchema> {
    return this.http
      .post<ScoringMccSchema>(`${this.apiUrl}/${caseId}/score/override`, payload)
      .pipe(
        tap((result) => console.warn('✅ [Scoring MCC] Override applied:', result)),
        catchError((err) => {
          console.error('❌ [Scoring MCC] Override error:', err);
          return throwError(() => err);
        }),
      );
  }
}
