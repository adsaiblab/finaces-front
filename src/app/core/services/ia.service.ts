import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { IAPredictionResult, WhatIfPayload, WhatIfSimulationResult } from '../models/ia.model';

@Injectable({
    providedIn: 'root'
})
export class IaService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/ia/cases`;

    public getPrediction(caseId: string): Observable<IAPredictionResult> {
        return this.http.get<IAPredictionResult>(`${this.apiUrl}/${caseId}/predict`).pipe(
            tap(result => console.log('✅ [IA Model] Prediction fetched successfully:', result)),
            catchError(err => {
                console.error('❌ [IA Model] Prediction error:', err);
                return throwError(() => new Error('AI Prediction model is currently unavailable. Proceed with MCC Scoring only.'));
            })
        );
    }

    public runWhatIfSimulation(caseId: string, payload: WhatIfPayload): Observable<WhatIfSimulationResult> {
        return this.http.post<WhatIfSimulationResult>(`${this.apiUrl}/${caseId}/simulate`, payload).pipe(
            tap(result => console.log('✅ [IA Model] What-If Simulation complete:', result)),
            catchError(err => {
                console.error('❌ [IA Model] Simulation error:', err);
                return throwError(() => new Error('Failed to run What-If simulation. Please check input parameters.'));
            })
        );
    }
}