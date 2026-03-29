import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    FinancialStatementCreate,
    FinancialStatementRawOut,
    FinancialStatementNormalizedSchema,
    RatioSetGrouped,
} from '../models';

@Injectable({
    providedIn: 'root',
})
export class FinancialService {
    private readonly http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/cases`;

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

    computeRatios(caseId: string): Observable<RatioSetGrouped> {
        return this.http.post<RatioSetGrouped>(
            `${this.apiUrl}/${caseId}/ratios/compute`,
            {}
        );
    }
}