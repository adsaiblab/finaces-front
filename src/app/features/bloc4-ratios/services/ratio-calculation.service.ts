import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { RatioSetGrouped, RatioValue } from '../../../core/models/ratio.model';

@Injectable({
    providedIn: 'root'
})
export class RatioCalculationService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/cases`;

    public computeRatios(caseId: string, fiscalYear?: number): Observable<RatioSetGrouped> {
        let params = new HttpParams();
        if (fiscalYear) {
            params = params.set('fiscal_year', fiscalYear.toString());
        }

        return this.http.post<RatioSetGrouped>(`${this.apiUrl}/${caseId}/ratios/compute`, {}, { params }).pipe(
            tap(result => console.log('✅ [Ratios] Computed successfully:', result)),
            catchError(err => {
                console.error('❌ [Ratios] Calculation error:', err);
                return throwError(() => new Error('Failed to compute financial ratios. Please check the normalized data.'));
            })
        );
    }

    public requiresDeepDive(ratioValue: RatioValue): boolean {
        return ratioValue.status === 'RED' || ratioValue.status === 'ORANGE';
    }
}