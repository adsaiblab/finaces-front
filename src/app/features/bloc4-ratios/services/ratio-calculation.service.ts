import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { RatioSetGrouped, RatioValue } from '../../../core/models/ratio.model';
import { RatioMapper } from '../../../core/mappers/ratio.mapper';
import { RatioSetFlat } from '../../../core/models/scoring.model';

@Injectable({
  providedIn: 'root',
})
export class RatioCalculationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/cases`;

  public computeRatios(caseId: string, fiscalYear?: number): Observable<RatioSetGrouped> {
    let params = new HttpParams();
    if (fiscalYear) {
      params = params.set('fiscal_year', fiscalYear.toString());
    }

    return this.http
      .post<any[]>(`${this.apiUrl}/${caseId}/ratios/compute`, {}, { params })
      .pipe(
        map((ratiosArray) => {
           if (!ratiosArray || ratiosArray.length === 0) throw new Error("No ratios returned by backend");
           // Sort descending by fiscal_year to get the latest
           const latestRatio = ratiosArray.sort((a, b) => b.fiscal_year - a.fiscal_year)[0];
           return RatioMapper.fromBackendFlat(latestRatio as RatioSetFlat);
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
