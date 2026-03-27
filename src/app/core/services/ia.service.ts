import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { IAPredictionResult, WhatIfScenarioInput, WhatIfScenarioResult } from '../models/ia.model';

@Injectable({
    providedIn: 'root'
})
export class IaService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/ia/cases`;

    public getPrediction(caseId: string): Observable<IAPredictionResult> {
        return this.http.get<IAPredictionResult>(`${this.apiUrl}/${caseId}/predict`).pipe(
            tap(result => { if (!environment.production) console.log('✅ [IA Model] Prediction fetched successfully:', result); }),
            catchError(err => {
                if (!environment.production) console.error('❌ [IA Model] Prediction error:', err);
                return throwError(() => new Error('AI Prediction model is currently unavailable. Proceed with MCC Scoring only.'));
            })
        );
    }

    public simulateWhatIf(caseId: string, scenario: WhatIfScenarioInput): Observable<WhatIfScenarioResult> {
        return this.http.post<WhatIfScenarioResult>(`${this.apiUrl}/${caseId}/simulate`, scenario).pipe(
            tap(result => { if (!environment.production) console.log('✅ [IA Model] What-If Simulation complete:', result); }),
            catchError(err => {
                if (!environment.production) console.error('❌ [IA Model] Simulation error:', err);
                return throwError(() => new Error('Failed to run What-If simulation. Please check input parameters.'));
            })
        );
    }
}