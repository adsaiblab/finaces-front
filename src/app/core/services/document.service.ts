import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    DocumentOut,
    DocumentStatusUpdate,
    GateDecisionSchema,
    IntegrityCheckResult,
} from '../models';

@Injectable({
    providedIn: 'root',
})
export class DocumentService {
    private apiUrl = `${environment.apiUrl}/cases`;

    constructor(private http: HttpClient) { }

    uploadDocument(caseId: string, file: File): Observable<DocumentOut> {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<DocumentOut>(
            `${this.apiUrl}/${caseId}/documents`,
            formData
        );
    }

    getDocuments(caseId: string): Observable<DocumentOut[]> {
        return this.http.get<DocumentOut[]>(
            `${this.apiUrl}/${caseId}/documents`
        );
    }

    checkIntegrity(
        caseId: string,
        docId: string
    ): Observable<IntegrityCheckResult> {
        return this.http.get<IntegrityCheckResult>(
            `${this.apiUrl}/${caseId}/documents/${docId}/integrity`
        );
    }

    updateDocumentStatus(
        docId: string,
        payload: DocumentStatusUpdate
    ): Observable<void> {
        return this.http.patch<void>(
            `${this.apiUrl}/documents/${docId}/status`,
            payload
        );
    }

    evaluateGate(caseId: string): Observable<GateDecisionSchema> {
        return this.http.post<GateDecisionSchema>(
            `${this.apiUrl}/${caseId}/gate/evaluate`,
            {}
        );
    }
}