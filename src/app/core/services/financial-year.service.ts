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
    // Backend requires a complete FinancialStatementNestedCreate body;
    // we send a minimal zero-value skeleton so the endpoint accepts it.
    const payload = {
      fiscal_year: year,
      currency_original: 'MAD',
      exchange_rate_to_usd: 1.0,
      referentiel: 'PCM',
      is_consolidated: false,
      balance_sheet_assets: {
        liquid_assets: 0,
        inventory: 0,
        other_noncurrent_assets: 0,
      },
      balance_sheet_liabilities: {
        long_term_debt: 0,
      },
      income_statement: {
        revenue: 0,
      },
      cash_flow: {
        operating_cash_flow: 0,
        investing_cash_flow: 0,
        financing_cash_flow: 0,
      },
    };
    return this.http.post<any>(`${this.apiUrl}/${caseId}/financials`, payload);
  }
}
