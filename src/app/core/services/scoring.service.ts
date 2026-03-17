import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    ScorecardOutputSchema,
    RecommendationUpdate,
} from '../models';

@Injectable({
    providedIn: 'root',
})
export class ScoringService {
    private apiUrl = `${environment.apiUrl}/cases`;

    constructor(private http: HttpClient) { }

    computeScore(caseId: string): Observable<ScorecardOutputSchema> {
        return this.http.post<ScorecardOutputSchema>(
            `${this.apiUrl}/${caseId}/score`,
            {}
        );
    }

    submitRecommendation(
        caseId: string,
        payload: RecommendationUpdate
    ): Observable<void> {
        return this.http.post<void>(
            `${this.apiUrl}/${caseId}/recommendation`,
            payload
        );
    }
}