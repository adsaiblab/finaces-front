import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { FinancialStatementRawOut } from '../models';

@Injectable({
  providedIn: 'root'
})
export class FinancialYearService {
  private readonly http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/cases`;

  loadAvailableYears(caseId: string): Observable<number[]> {
    return this.http.get<FinancialStatementRawOut[]>(`${this.apiUrl}/${caseId}/financials`).pipe(
      map(statements => {
        const years = statements.map(s => s.fiscal_year);
        // Extract distinct years and sort descending
        const distinctYears = Array.from(new Set(years)).sort((a, b) => b - a);
        return distinctYears;
      })
    );
  }

  addFiscalYear(caseId: string, year: number): Observable<any> {
    const payload = { fiscal_year: year };
    return this.http.post<any>(`${this.apiUrl}/${caseId}/financials`, payload);
  }
}
