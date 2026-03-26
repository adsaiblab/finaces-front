import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConsortiumScorecardOutput, ConsortiumMemberCreate } from '../models/consortium.model';

@Injectable({
    providedIn: 'root',
})
export class ConsortiumService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/cases`;

    getConsortium(caseId: string): Observable<ConsortiumScorecardOutput> {
        return this.http.get<ConsortiumScorecardOutput>(`${this.apiUrl}/${caseId}/consortium`);
    }

    addMember(caseId: string, payload: ConsortiumMemberCreate): Observable<ConsortiumScorecardOutput> {
        return this.http.post<ConsortiumScorecardOutput>(`${this.apiUrl}/${caseId}/consortium/members`, payload);
    }

    updateMember(caseId: string, memberId: string, payload: Partial<ConsortiumMemberCreate>): Observable<ConsortiumScorecardOutput> {
        return this.http.patch<ConsortiumScorecardOutput>(`${this.apiUrl}/${caseId}/consortium/members/${memberId}`, payload);
    }

    removeMember(caseId: string, memberId: string): Observable<ConsortiumScorecardOutput> {
        return this.http.delete<ConsortiumScorecardOutput>(`${this.apiUrl}/${caseId}/consortium/members/${memberId}`);
    }

    calculateConsortium(caseId: string): Observable<ConsortiumScorecardOutput> {
        return this.http.post<ConsortiumScorecardOutput>(`${this.apiUrl}/${caseId}/consortium/calculate`, {});
    }
}