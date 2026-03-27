import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { GateDocumentOut, DocumentIntegrityResult } from '../models/gate.model';

@Injectable({
    providedIn: 'root',
})
export class DocumentService {
    private apiUrl = `${environment.apiUrl}/cases`;

    private readonly http = inject(HttpClient);

    private readonly handleError = (err: HttpErrorResponse): Observable<never> => {
        if (!environment.production) console.error('[DocumentService]', err);
        return throwError(() => err);
    };

    uploadGateDocument(caseId: string, formData: FormData): Observable<GateDocumentOut> {
        return this.http.post<GateDocumentOut>(
            `${this.apiUrl}/${caseId}/documents`,
            formData
        ).pipe(catchError(this.handleError));
    }

    getGateDocuments(caseId: string): Observable<GateDocumentOut[]> {
        return this.http.get<GateDocumentOut[]>(
            `${this.apiUrl}/${caseId}/documents`
        ).pipe(catchError(this.handleError));
    }

    getDocumentIntegrity(caseId: string, docId: string): Observable<DocumentIntegrityResult> {
        return this.http.get<DocumentIntegrityResult>(
            `${this.apiUrl}/${caseId}/documents/${docId}/integrity`
        ).pipe(catchError(this.handleError));
    }

    deleteDocument(caseId: string, docId: string): Observable<void> {
        return this.http.delete<void>(
            `${this.apiUrl}/${caseId}/documents/${docId}`
        ).pipe(catchError(this.handleError));
    }

    downloadDocument(caseId: string, docId: string): Observable<Blob> {
        return this.http.get(
            `${this.apiUrl}/${caseId}/documents/${docId}/download`,
            { responseType: 'blob' }
        ).pipe(catchError(this.handleError));
    }
}