import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    CaseCreate,
    CaseStatus,
    EvaluationCaseOut,
    EvaluationCaseDetailOut,
    CaseStatusResponse,
    StatusTransition,
    BidderOut,
} from '../models';

@Injectable({
    providedIn: 'root',
})
export class CaseService {
    private apiUrl = `${environment.apiUrl}/cases`;

    constructor(private http: HttpClient) { }

    getCases(): Observable<EvaluationCaseOut[]> {
        return this.http.get<EvaluationCaseOut[]>(this.apiUrl);
    }

    getCaseDetail(caseId: string): Observable<EvaluationCaseDetailOut> {
        return this.http.get<EvaluationCaseDetailOut>(`${this.apiUrl}/${caseId}`);
    }

    createCase(payload: CaseCreate): Observable<EvaluationCaseDetailOut> {
        return this.http.post<EvaluationCaseDetailOut>(this.apiUrl, payload);
    }

    getCaseStatus(caseId: string): Observable<CaseStatusResponse> {
        return this.http.get<CaseStatusResponse>(`${this.apiUrl}/${caseId}/status`);
    }

    transitionStatus(
        caseId: string,
        payload: StatusTransition
    ): Observable<CaseStatusResponse> {
        return this.http.patch<CaseStatusResponse>(
            `${this.apiUrl}/${caseId}/status`,
            payload
        );
    }

    getBidders(): Observable<BidderOut[]> {
        return this.http.get<BidderOut[]>(`${this.apiUrl}/bidders`);
    }
}