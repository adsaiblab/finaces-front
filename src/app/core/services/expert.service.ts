import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
    ExpertReviewInputSchema,
    ExpertReviewOutputSchema,
    ConclusionUpdate,
} from '../models';

@Injectable({
    providedIn: 'root',
})
export class ExpertService {
    private readonly http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/cases`;

    private readonly handleError = (error: HttpErrorResponse): Observable<never> => {
        if (!environment.production) console.error('[Expert] Error:', error);
        return throwError(() => error);
    };

    submitExpertReview(
        caseId: string,
        payload: ExpertReviewInputSchema
    ): Observable<ExpertReviewOutputSchema> {
        return this.http.post<ExpertReviewOutputSchema>(
            `${this.apiUrl}/${caseId}/experts/review`,
            payload
        ).pipe(
            catchError(this.handleError)
        );
    }

    submitConclusion(
        caseId: string,
        payload: ConclusionUpdate
    ): Observable<void> {
        return this.http.patch<void>(
            `${this.apiUrl}/${caseId}/conclusion`,
            payload
        ).pipe(
            catchError(this.handleError)
        );
    }
}