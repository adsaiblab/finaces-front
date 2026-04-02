import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  IAPredictionResult,
  IAPredictionOut,
  WhatIfScenarioInput,
  WhatIfScenarioResult,
  WhatIfInput,
  WhatIfResult,
  IAModelInfo,
} from '../models/ia.model';
import { ConvergenceDataPoint } from '../models/ia-admin.model';

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
        return throwError(
          () =>
            new Error(
              'AI Prediction model is currently unavailable. Proceed with MCC Scoring only.',
            ),
        );
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
        return throwError(() => new Error('Failed to retrieve active IA model information.'));
      }),
    );
  }

  public getConvergenceChart(modelId: string): Observable<ConvergenceDataPoint[]> {
    return this.http
      .get<ConvergenceDataPoint[]>(`${this.baseUrl}/ia/models/${modelId}/convergence`)
      .pipe(
        catchError((err) => {
          if (!environment.production)
            console.error('[IA Model] Convergence chart error:', err);
          return throwError(
            () => new Error('Failed to retrieve convergence data for this model.'),
          );
        }),
      );
  }
}
