import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ScoringMccSchema, ScoreOverridePayload } from '../../../core/models/scoring.model';

@Injectable({
    providedIn: 'root'
})
export class ScoringMccService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/cases`;

    public getScoring(caseId: string): Observable<ScoringMccSchema> {
        return this.http.get<ScoringMccSchema>(`${this.apiUrl}/${caseId}/score`).pipe(
            tap(result => console.log('✅ [Scoring MCC] Fetched successfully:', result)),
            catchError(err => {
                console.error('❌ [Scoring MCC] Fetch error:', err);
                return throwError(() => new Error('Failed to retrieve MCC Scoring.'));
            })
        );
    }

    public overrideScore(caseId: string, payload: ScoreOverridePayload): Observable<ScoringMccSchema> {
        return this.http.post<ScoringMccSchema>(`${this.apiUrl}/${caseId}/score/override`, payload).pipe(
            tap(result => console.log('✅ [Scoring MCC] Override applied:', result)),
            catchError(err => {
                console.error('❌ [Scoring MCC] Override error:', err);
                return throwError(() => new Error('Failed to apply manual score override.'));
            })
        );
    }
}