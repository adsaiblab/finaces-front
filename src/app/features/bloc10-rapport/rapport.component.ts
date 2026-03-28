// ═══════════════════════════════════════════════════════════════
// T41 + T42 + T43 — RapportComponent (V2)
//   T41: Wire POST /cases/{id}/report/build
//   T42: Wire Word/PDF export (replaces window.print())
//   T43: Wire audit trail /api/v1/audit/*
// ═══════════════════════════════════════════════════════════════
import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CaseService } from '../../core/services/case.service';
import { ReportService } from '../../core/services/report.service';
import { AuditService } from '../../core/services/audit.service';
import { RapportExportService } from './services/rapport-export.service';
import { EvaluationCaseDetailOut } from '../../core/models/case.model';
import { MCCGradeReportOut, REPORT_SECTION_LABELS } from '../../core/models/report.model';
import { AuditEvent } from '../../core/models/audit.model';
import { RapportGridComponent, RapportMetricsComponent } from './components';
import { FinacesRiskBadgeComponent } from '../../shared/components/atoms/finaces-risk-badge/finaces-risk-badge.component';
import { FinacesTensionBadgeComponent } from '../../shared/components/atoms/finaces-tension-badge/finaces-tension-badge.component';
import { FinacesScoreGaugeComponent } from '../../shared/components/atoms/finaces-score-gauge/finaces-score-gauge.component';

@Component({
    selector: 'app-rapport-final',
    standalone: true,
    imports: [
        MatButtonModule,
        MatProgressBarModule,
        MatChipsModule,
        MatIconModule,
        MatTooltipModule,
        RapportGridComponent,
        RapportMetricsComponent,
        FinacesRiskBadgeComponent,
        FinacesTensionBadgeComponent,
        FinacesScoreGaugeComponent,
        MatSnackBarModule,
        DatePipe,
        DecimalPipe,
    ],
    templateUrl: './rapport.component.html',
    styleUrls: ['./rapport.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RapportComponent {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private caseService = inject(CaseService);
    private reportService = inject(ReportService);
    private auditService = inject(AuditService);
    private exportService = inject(RapportExportService);
    private snackBar = inject(MatSnackBar);
    private readonly destroyRef = inject(DestroyRef);

    // ─── State ───────────────────────────────────────────────
    caseId = '';
    currentCase = signal<EvaluationCaseDetailOut | null>(null);
    report = signal<MCCGradeReportOut | null>(null);
    auditTrail = signal<AuditEvent[]>([]);
    isLoading = signal<boolean>(true);
    isBuilding = signal<boolean>(false);
    isExporting = signal<boolean>(false);
    exportFormat = signal<string>('');

    // ─── Computed ────────────────────────────────────────────
    sectionLabels = REPORT_SECTION_LABELS;

    reportProgress = computed(() => {
        const r = this.report();
        if (!r) return 0;
        return Math.round((r.sections_complete / r.sections_total) * 100);
    });

    hasReport = computed(() => !!this.report());

    isReportFinal = computed(() => this.report()?.status === 'FINAL');

    // ─── Lifecycle ───────────────────────────────────────────
    ngOnInit(): void {
        this.caseId =
            this.route.parent?.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('id') || '';
        if (!this.caseId) {
            this.router.navigate(['/dashboard']);
            return;
        }
        this.loadCaseData();
    }

    // ─── Data Loading ────────────────────────────────────────
    private loadCaseData(): void {
        this.isLoading.set(true);
        this.caseService
            .getCaseDetail(this.caseId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data: EvaluationCaseDetailOut) => {
                    this.currentCase.set(data);
                    this.loadExistingReport();
                    this.loadAuditTrail();
                },
                error: () => {
                    this.isLoading.set(false);
                    this.snackBar.open('Error loading case data.', 'Close', { duration: 3000 });
                },
            });
    }

    private loadExistingReport(): void {
        this.reportService
            .getReport(this.caseId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (report) => {
                    this.report.set(report);
                    this.isLoading.set(false);
                },
                error: () => {
                    // No report yet — that's fine
                    this.report.set(null);
                    this.isLoading.set(false);
                },
            });
    }

    /** T43: Load audit trail for this case */
    private loadAuditTrail(): void {
        this.auditService
            .getTrail({ case_id: this.caseId, limit: 100 })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (events) => this.auditTrail.set(events),
                error: () => {
                    // Audit trail is non-critical, silent fail
                },
            });
    }

    // ─── T41: Build Report ───────────────────────────────────
    buildReport(): void {
        this.isBuilding.set(true);
        this.reportService
            .buildReport(this.caseId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (report) => {
                    this.report.set(report);
                    this.isBuilding.set(false);
                    this.loadAuditTrail(); // Refresh audit trail after build
                    this.snackBar.open(
                        `Report generated: ${report.sections_complete}/${report.sections_total} sections complete.`,
                        'Close',
                        { duration: 5000 },
                    );
                },
                error: (err) => {
                    this.isBuilding.set(false);
                    this.snackBar.open(`Error generating report: ${err.message}`, 'Close', { duration: 5000 });
                },
            });
    }

    finalizeReport(): void {
        const r = this.report();
        if (!r) return;
        this.reportService
            .finalizeReport(this.caseId, r.report_id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.report.set({ ...r, status: 'FINAL' });
                    this.loadAuditTrail();
                    this.snackBar.open('Report finalized.', 'Close', { duration: 3000 });
                },
                error: (err) => {
                    this.snackBar.open(`Error finalizing report: ${err.message}`, 'Close', { duration: 5000 });
                },
            });
    }

    // ─── T42: Export ─────────────────────────────────────────
    exportPdf(): void {
        this.isExporting.set(true);
        this.exportFormat.set('PDF');
        this.exportService
            .exportToPdf(this.caseId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.isExporting.set(false);
                    this.exportFormat.set('');
                    this.loadAuditTrail();
                    this.snackBar.open('PDF downloaded successfully.', 'Close', { duration: 3000 });
                },
                error: (err) => {
                    this.isExporting.set(false);
                    this.exportFormat.set('');
                    this.snackBar.open(`PDF export failed: ${err.message}`, 'Close', { duration: 5000 });
                },
            });
    }

    exportWord(): void {
        this.isExporting.set(true);
        this.exportFormat.set('Word');
        this.exportService
            .exportToWord(this.caseId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.isExporting.set(false);
                    this.exportFormat.set('');
                    this.loadAuditTrail();
                    this.snackBar.open('Word document downloaded successfully.', 'Close', { duration: 3000 });
                },
                error: (err) => {
                    this.isExporting.set(false);
                    this.exportFormat.set('');
                    this.snackBar.open(`Word export failed: ${err.message}`, 'Close', { duration: 5000 });
                },
            });
    }

    /** T43: Export audit trail as CSV */
    exportAuditCsv(): void {
        this.auditService
            .exportCsv(this.caseId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (blob) => {
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `audit_trail_${this.caseId.substring(0, 8)}.csv`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                },
                error: () => {
                    this.snackBar.open('Error exporting audit trail.', 'Close', { duration: 3000 });
                },
            });
    }

    // ─── Navigation ──────────────────────────────────────────
    returnToDashboard(): void {
        this.router.navigate(['/dashboard']);
    }
}
