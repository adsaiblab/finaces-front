import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BidderSearchOut, BidderCreateSchema, BidderOut } from '../models/bidder.model';

@Injectable({
    providedIn: 'root'
})
export class BidderService {
    private readonly http = inject(HttpClient);
    private readonly apiUrl = `${environment.apiUrl}/bidders`; // Ajuster selon le swagger réel

    searchBidders(query: string): Observable<BidderSearchOut[]> {
        const params = new HttpParams().set('search', query);
        return this.http.get<BidderSearchOut[]>(`${environment.apiUrl}/cases/bidders`, { params });
    }

    createBidder(data: BidderCreateSchema): Observable<BidderOut> {
        return this.http.post<BidderOut>(this.apiUrl, data);
    }
}