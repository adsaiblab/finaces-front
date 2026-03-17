import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConsortiumScorecardOutput } from '../models';

@Injectable({
    providedIn: 'root',
})
export class ConsortiumService {
    private apiUrl = `${environment.apiUrl}/cases`;

    constructor(private http: HttpClient) { }

    calculateConsortium(
        caseId: string
    ): Observable<ConsortiumScorecardOutput> {
        return this.http.post<ConsortiumScorecardOutput>(
            `${this.apiUrl}/${caseId}/consortium/calculate`,
            {}
        );
    }
}