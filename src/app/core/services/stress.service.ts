import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    StressScenarioInputSchema,
    StressResultSchema,
} from '../models';

@Injectable({
    providedIn: 'root',
})
export class StressService {
    private apiUrl = `${environment.apiUrl}/cases`;

    constructor(private http: HttpClient) { }

    runStressTest(
        caseId: string,
        payload: StressScenarioInputSchema
    ): Observable<StressResultSchema> {
        return this.http.post<StressResultSchema>(
            `${this.apiUrl}/${caseId}/stress/run`,
            payload
        );
    }
}