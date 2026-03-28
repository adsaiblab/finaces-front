import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StressResultSchema, StressScenarioInputSchema, MacroShockInput, MacroShockResult } from '../models/stress.model';

@Injectable({
    providedIn: 'root'
})
export class StressService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/cases`;

    // Fetch previously computed stress test results
    public getStressTests(caseId: string): Observable<StressResultSchema[]> {
        return this.http.get<StressResultSchema[]>(`${this.apiUrl}/${caseId}/stress`).pipe(
            tap(res => { if (!environment.production) console.log('[Stress Test] Fetched successfully:', res); }),
            catchError(err => {
                if (!environment.production) console.error('[Stress Test] Fetch error:', err);
                return throwError(() => new Error('Failed to retrieve stress test data.'));
            })
        );
    }

    // Run a custom contract stress simulation
    public runCustomStressTest(caseId: string, params: StressScenarioInputSchema): Observable<StressResultSchema> {
        return this.http.post<StressResultSchema>(`${this.apiUrl}/${caseId}/stress/simulate`, params).pipe(
            tap(res => { if (!environment.production) console.log('[Stress Test] Custom simulation complete:', res); }),
            catchError(err => {
                if (!environment.production) console.error('[Stress Test] Simulation error:', err);
                return throwError(() => new Error('Failed to run custom stress simulation.'));
            })
        );
    }

    // Run a macro shock stress simulation
    public runMacroShock(caseId: string, input: MacroShockInput): Observable<MacroShockResult> {
        return this.http.post<MacroShockResult>(`${this.apiUrl}/${caseId}/stress/macro`, input).pipe(
            tap(res => { if (!environment.production) console.log('[Stress Test] Macro shock simulation complete:', res); }),
            catchError(err => {
                if (!environment.production) console.error('[Stress Test] Macro shock error:', err);
                return throwError(() => new Error('Failed to run macro shock stress simulation.'));
            })
        );
    }

    // Get all stress results for a case (both contract and macro)
    public getStressResults(caseId: string): Observable<StressResultSchema[]> {
        return this.http.get<StressResultSchema[]>(`${this.apiUrl}/${caseId}/stress`).pipe(
            tap(res => { if (!environment.production) console.log('[Stress Test] All results fetched:', res); }),
            catchError(err => {
                if (!environment.production) console.error('[Stress Test] Fetch all results error:', err);
                return throwError(() => new Error('Failed to retrieve stress results.'));
            })
        );
    }
}
