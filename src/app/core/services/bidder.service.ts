import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { BidderSearchOut, BidderCreateSchema, BidderOut } from '../models/bidder.model';

@Injectable({
    providedIn: 'root'
})
export class BidderService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/bidders`; // Ajuster selon le swagger réel

    private readonly handleError = (error: HttpErrorResponse): Observable<never> => {
        if (!environment.production) {
            console.error('BidderService API Error:', error);
        }
        return throwError(() => new Error(error.message || 'Server Error'));
    };

    searchBidders(query: string): Observable<BidderSearchOut[]> {
        const params = new HttpParams().set('search', query);
        return this.http.get<BidderSearchOut[]>(`${environment.apiUrl}/cases/bidders`, { params })
            .pipe(catchError(this.handleError));
    }

    /**
     * @deprecated T38/Q27:B — Bidders are now created alongside cases via POST /cases.
     * Use CaseService.createCase() with bidder_name/bidder_id instead.
     */
    createBidder(data: BidderCreateSchema): Observable<BidderOut> {
        return this.http.post<BidderOut>(this.apiUrl, data)
            .pipe(catchError(this.handleError));
    }

    getBidders(): Observable<BidderOut[]> {
        return this.http.get<BidderOut[]>(this.apiUrl).pipe(
            catchError(this.handleError)
        );
    }
}