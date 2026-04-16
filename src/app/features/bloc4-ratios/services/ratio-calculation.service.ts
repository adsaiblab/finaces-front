import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { RatioSetGrouped, RatioValue } from '../../../core/models/ratio.model';
import { RatioMapper } from '../../../core/mappers/ratio.mapper';

@Injectable({
  providedIn: 'root',
})
export class RatioCalculationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/cases`;

  public computeRatios(caseId: string): Observable<{ years: number[]; ratiosByYear: Map<number, RatioSetGrouped> }> {
    return this.http
      .post<any[]>(`${this.apiUrl}/${caseId}/ratios/compute`, {}, {})
      .pipe(
        map((ratiosArray) => {
           if (!ratiosArray || ratiosArray.length === 0) throw new Error("No ratios returned by backend");
           const sorted = [...ratiosArray].sort((a, b) => b.fiscal_year - a.fiscal_year);
           const ratiosByYear = new Map<number, RatioSetGrouped>();
           sorted.forEach(raw => ratiosByYear.set(raw.fiscal_year, RatioMapper.fromBackendFlat(raw)));
           return { years: sorted.map(r => r.fiscal_year), ratiosByYear };
        }),
        tap((result) => console.warn('✅ [Ratios] Mapped successfully to Grouped:', result)),
        catchError((err) => {
          console.error('❌ [Ratios] Calculation error:', err);
          return throwError(
            () =>
              new Error('Failed to compute financial ratios. Please check the normalized data.'),
          );
        }),
      );
  }

  public requiresDeepDive(ratioValue: RatioValue): boolean {
    return ratioValue.status === 'RED' || ratioValue.status === 'ORANGE';
  }
}
