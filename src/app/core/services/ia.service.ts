import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IAPredictionResult } from '../models';

@Injectable({
    providedIn: 'root',
})
export class IaService {
    private apiUrl = `${environment.apiUrl}`;

    constructor(private http: HttpClient) { }

    predictIA(caseId: string, features: Record<string, any>): Observable<IAPredictionResult> {
        return this.http.post<IAPredictionResult>(
            `${this.apiUrl}/ia/cases/${caseId}/predict`,
            features
        );
    }
}