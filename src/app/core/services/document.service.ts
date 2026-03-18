import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { GateDocumentOut, GateDecisionSchema } from '../models/gate.model';

@Injectable({
    providedIn: 'root',
})
export class DocumentService {
    private apiUrl = `${environment.apiUrl}/cases`;

    constructor(private http: HttpClient) { }

    uploadGateDocument(caseId: string, formData: FormData): Observable<GateDocumentOut> {
        return this.http.post<GateDocumentOut>(
            `${this.apiUrl}/${caseId}/documents`,
            formData
        );
    }

    getGateDocuments(caseId: string): Observable<GateDocumentOut[]> {
        return this.http.get<GateDocumentOut[]>(
            `${this.apiUrl}/${caseId}/documents`
        );
    }

    getDocumentIntegrity(caseId: string, docId: string): Observable<any> {
        return this.http.get<any>(
            `${this.apiUrl}/${caseId}/documents/${docId}/integrity`
        );
    }

    deleteDocument(caseId: string, docId: string): Observable<void> {
        return this.http.delete<void>(
            `${this.apiUrl}/${caseId}/documents/${docId}`
        );
    }
}