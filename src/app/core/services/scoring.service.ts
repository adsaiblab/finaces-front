import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
    ScorecardOutputSchema,
    RecommendationUpdate,
} from '../models';

@Injectable({
    providedIn: 'root',
})
export class ScoringService {
    private readonly http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/cases`;

    private readonly handleError = (error: HttpErrorResponse): Observable<never> => {
        if (!environment.production) console.error('[Scoring] Error:', error);
        return throwError(() => error);
    };

    computeScore(caseId: string): Observable<ScorecardOutputSchema> {
        return this.http.post<ScorecardOutputSchema>(
            `${this.apiUrl}/${caseId}/score`,
            {}
        ).pipe(
            catchError(this.handleError)
        );
    }

    submitRecommendation(
        caseId: string,
        payload: RecommendationUpdate
    ): Observable<void> {
        return this.http.post<void>(
            `${this.apiUrl}/${caseId}/recommendation`,
            payload
        ).pipe(
            catchError(this.handleError)
        );
    }
}