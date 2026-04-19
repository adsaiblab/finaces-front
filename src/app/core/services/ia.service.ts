import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  IAPredictionOut,
  WhatIfInput,
  WhatIfResult,
  IAModelInfo,
} from '../models/ia.model';
import { ConvergenceChartResponse } from '../models/ia-admin.model';

@Injectable({
  providedIn: 'root',
})
export class IaService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  public getPrediction(caseId: string): Observable<IAPredictionOut> {
    return this.http.get<IAPredictionOut>(`${this.baseUrl}/ia/predict/${caseId}`).pipe(
      catchError((err) => {
        if (!environment.production) console.error('[IA Model] Prediction error:', err);
        return throwError(() => err);
      }),
    );
  }

  public simulateWhatIf(caseId: string, scenario: WhatIfInput): Observable<WhatIfResult> {
    return this.http
      .post<WhatIfResult>(`${this.baseUrl}/ia/cases/${caseId}/simulate`, scenario)
      .pipe(
        catchError((err) => {
          if (!environment.production) console.error('[IA Model] Simulation error:', err);
          return throwError(
            () => new Error('Failed to run What-If simulation. Please check input parameters.'),
          );
        }),
      );
  }

  public getActiveModel(): Observable<IAModelInfo> {
    return this.http.get<IAModelInfo>(`${this.baseUrl}/ia/models/active`).pipe(
      catchError((err) => {
        if (!environment.production) console.error('[IA Model] Get active model error:', err);
        return throwError(() => err);
      }),
    );
  }

  /**
   * Fetches convergence chart data for the admin dashboard.
   *
   * Backend: GET /ia/analytics/convergence?days={days}
   * Returns: { days, data_points: ConvergenceDataPoint[], convergence_pct }
   *
   * @param days  Time window in days (7–365). Defaults to 30.
   */
  public getConvergenceChart(days = 30): Observable<ConvergenceChartResponse> {
    return this.http
      .get<ConvergenceChartResponse>(`${this.baseUrl}/ia/analytics/convergence`, {
        params: { days: days.toString() },
      })
      .pipe(
        catchError((err) => {
          if (!environment.production)
            console.error('[IA Model] Convergence chart error:', err);
          return throwError(
            () => new Error('Failed to retrieve convergence data.'),
          );
        }),
      );
  }
}
