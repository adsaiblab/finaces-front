import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { StressResultSchema, StressScenarioInputSchema } from '../models/stress.model';

@Injectable({
    providedIn: 'root'
})
export class StressService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/cases`;

    // Récupère les résultats de stress tests précédemment calculés
    public getStressTests(caseId: string): Observable<StressResultSchema[]> {
        return this.http.get<StressResultSchema[]>(`${this.apiUrl}/${caseId}/stress`).pipe(
            tap(res => console.log('✅ [Stress Test] Fetched successfully:', res)),
            catchError(err => {
                console.error('❌ [Stress Test] Fetch error:', err);
                return throwError(() => new Error('Failed to retrieve stress test data.'));
            })
        );
    }

    // Lance une nouvelle simulation de stress
    public runCustomStressTest(caseId: string, params: StressScenarioInputSchema): Observable<StressResultSchema> {
        return this.http.post<StressResultSchema>(`${this.apiUrl}/${caseId}/stress/simulate`, params).pipe(
            tap(res => console.log('✅ [Stress Test] Custom simulation complete:', res)),
            catchError(err => {
                console.error('❌ [Stress Test] Simulation error:', err);
                return throwError(() => new Error('Failed to run custom stress simulation.'));
            })
        );
    }
}