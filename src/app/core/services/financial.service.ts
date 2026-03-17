import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    FinancialStatementCreate,
    FinancialStatementRawOut,
    FinancialStatementNormalizedSchema,
    RatioSetSchema,
} from '../models';

@Injectable({
    providedIn: 'root',
})
export class FinancialService {
    private apiUrl = `${environment.apiUrl}/cases`;

    constructor(private http: HttpClient) { }

    createFinancialStatement(
        caseId: string,
        payload: FinancialStatementCreate
    ): Observable<FinancialStatementRawOut> {
        return this.http.post<FinancialStatementRawOut>(
            `${this.apiUrl}/${caseId}/financials`,
            payload
        );
    }

    getFinancialStatements(caseId: string): Observable<FinancialStatementRawOut[]> {
        return this.http.get<FinancialStatementRawOut[]>(
            `${this.apiUrl}/${caseId}/financials`
        );
    }

    deleteFinancialStatement(
        caseId: string,
        statementId: string
    ): Observable<void> {
        return this.http.delete<void>(
            `${this.apiUrl}/${caseId}/financials/${statementId}`
        );
    }

    normalizeFinancials(
        caseId: string
    ): Observable<FinancialStatementNormalizedSchema> {
        return this.http.post<FinancialStatementNormalizedSchema>(
            `${this.apiUrl}/${caseId}/normalize`,
            {}
        );
    }

    computeRatios(caseId: string): Observable<RatioSetSchema> {
        return this.http.post<RatioSetSchema>(
            `${this.apiUrl}/${caseId}/ratios/compute`,
            {}
        );
    }
}