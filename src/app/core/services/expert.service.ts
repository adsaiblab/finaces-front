import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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
    private apiUrl = `${environment.apiUrl}/cases`;

    constructor(private http: HttpClient) { }

    submitExpertReview(
        caseId: string,
        payload: ExpertReviewInputSchema
    ): Observable<ExpertReviewOutputSchema> {
        return this.http.post<ExpertReviewOutputSchema>(
            `${this.apiUrl}/${caseId}/experts/review`,
            payload
        );
    }

    submitConclusion(
        caseId: string,
        payload: ConclusionUpdate
    ): Observable<void> {
        return this.http.patch<void>(
            `${this.apiUrl}/${caseId}/conclusion`,
            payload
        );
    }
}