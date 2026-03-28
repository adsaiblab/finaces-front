// ═══════════════════════════════════════════════════════════════
// T42 — RapportExportService: Real export via backend endpoints
// Replaces window.print() with server-side Word/PDF generation
// ═══════════════════════════════════════════════════════════════
import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, tap } from 'rxjs';
import { ReportService } from '../../../core/services/report.service';
import { ExportResult } from '../../../core/models/report.model';

@Injectable({
    providedIn: 'root',
})
export class RapportExportService {
    private readonly reportService = inject(ReportService);

    /**
     * T42: Triggers server-side PDF generation, then downloads the file.
     * Replaces the old window.print() approach.
     */
    exportToPdf(caseId: string): Observable<Blob> {
        return this.reportService.exportPdf(caseId).pipe(
            switchMap(() => this.reportService.downloadPdf(caseId)),
            tap((blob) => this._downloadBlob(blob, `Note_MCC_${caseId.substring(0, 8)}.pdf`, 'application/pdf')),
        );
    }

    /**
     * T42: Triggers server-side Word generation, then downloads the file.
     * Replaces the old client-side CSV mock.
     */
    exportToWord(caseId: string): Observable<Blob> {
        return this.reportService.exportWord(caseId).pipe(
            switchMap(() => this.reportService.downloadWord(caseId)),
            tap((blob) =>
                this._downloadBlob(
                    blob,
                    `Note_MCC_${caseId.substring(0, 8)}.docx`,
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                ),
            ),
        );
    }

    /**
     * Utility: triggers browser download of a Blob.
     */
    private _downloadBlob(blob: Blob, filename: string, mimeType: string): void {
        const url = window.URL.createObjectURL(new Blob([blob], { type: mimeType }));
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
}
