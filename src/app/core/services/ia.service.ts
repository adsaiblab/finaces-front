import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { IAPredictionResult, IAPredictionOut, WhatIfScenarioInput, WhatIfScenarioResult, WhatIfInput, WhatIfResult, IAModelInfo } from '../models/ia.model';

@Injectable({
    providedIn: 'root'
})
export class IaService {
    private http = inject(HttpClient);
    private baseUrl = environment.apiUrl;

    public getPrediction(caseId: string): Observable<IAPredictionOut> {
        return this.http.get<IAPredictionOut>(`${this.baseUrl}/ia/predict/${caseId}`).pipe(
            tap(result => { if (!environment.production) console.log('[IA Model] Prediction fetched successfully:', result); }),
            catchError(err => {
                if (!environment.production) console.error('[IA Model] Prediction error:', err);
                return throwError(() => new Error('AI Prediction model is currently unavailable. Proceed with MCC Scoring only.'));
            })
        );
    }

    public simulateWhatIf(caseId: string, scenario: WhatIfInput): Observable<WhatIfResult> {
        return this.http.post<WhatIfResult>(`${this.baseUrl}/ia/predict/${caseId}/what-if`, scenario).pipe(
            tap(result => { if (!environment.production) console.log('[IA Model] What-If Simulation complete:', result); }),
            catchError(err => {
                if (!environment.production) console.error('[IA Model] Simulation error:', err);
                return throwError(() => new Error('Failed to run What-If simulation. Please check input parameters.'));
            })
        );
    }

    public getActiveModel(): Observable<IAModelInfo> {
        return this.http.get<IAModelInfo>(`${this.baseUrl}/ia/models/active`).pipe(
            tap(result => { if (!environment.production) console.log('[IA Model] Active model info:', result); }),
            catchError(err => {
                if (!environment.production) console.error('[IA Model] Get active model error:', err);
                return throwError(() => new Error('Failed to retrieve active IA model information.'));
            })
        );
    }
}
