import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class RapportExportService {

    exportToPdf(caseId: string): Observable<boolean> {
        // Triggers the browser's native print dialog which can save as PDF.
        // In a real backend scenario, this would call an endpoint returning a PDF Blob.
        window.print();
        return of(true).pipe(delay(500));
    }

    exportToExcel(caseId: string, data: any): Observable<boolean> {
        // Client-side mock CSV/Excel generation for demonstration
        const csvContent = 'data:text/csv;charset=utf-8,Section,Value\nCase ID,' + caseId + '\nStatus,CLOSED';
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `finaces_report_${caseId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return of(true).pipe(delay(500));
    }
}