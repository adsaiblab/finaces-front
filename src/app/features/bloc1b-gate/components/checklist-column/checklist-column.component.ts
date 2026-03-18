import { Component, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { GateDocumentOut, DocumentDocType } from '../../../../core/models/gate.model';

export interface DocumentCheck {
    type: DocumentDocType;
    label: string;
    uploaded: boolean;
    required: boolean;
}

export interface YearProgress {
    year: number;
    docs: DocumentCheck[];
    progressPercent: number;
}

@Component({
    selector: 'app-checklist-column',
    standalone: true,
    imports: [CommonModule, MatProgressBarModule, MatIconModule],
    templateUrl: './checklist-column.component.html',
    styleUrl: './checklist-column.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChecklistColumnComponent implements OnChanges {
    @Input() documents: GateDocumentOut[] = [];
    @Input() fiscalYears: number[] = [
        new Date().getFullYear() - 1,
        new Date().getFullYear() - 2,
        new Date().getFullYear() - 3
    ];

    yearlyProgress: YearProgress[] = [];
    totalProgressPercent = 0;

    private requiredTypes: { type: DocumentDocType; label: string; required: boolean }[] = [
        { type: 'BILAN', label: 'Bilan', required: true },
        { type: 'CPC', label: 'CPC', required: true },
        { type: 'TFT', label: 'TFT', required: true },
        { type: 'ATTESTATION_FISCALE', label: 'Attestation Fiscale', required: true },
        { type: 'STATUTS', label: 'Statuts', required: false }
    ];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['documents'] || changes['fiscalYears']) {
            this.calculateProgress();
        }
    }

    private calculateProgress(): void {
        let totalRequired = 0;
        let totalUploadedRequired = 0;

        this.yearlyProgress = this.fiscalYears.map(year => {
            let yearRequired = 0;
            let yearUploadedRequired = 0;

            const docsForYear = this.requiredTypes.map(rt => {
                // Un document est considéré valide s'il est présent et n'est pas en statut d'intégrité KO
                const isUploaded = this.documents.some(
                    d => d.fiscal_year === year && d.document_type === rt.type && d.integrity_status !== 'KO'
                );

                if (rt.required) {
                    yearRequired++;
                    totalRequired++;
                    if (isUploaded) {
                        yearUploadedRequired++;
                        totalUploadedRequired++;
                    }
                }

                return {
                    type: rt.type,
                    label: rt.label,
                    uploaded: isUploaded,
                    required: rt.required
                };
            });

            return {
                year,
                docs: docsForYear,
                progressPercent: yearRequired > 0 ? Math.round((yearUploadedRequired / yearRequired) * 100) : 0
            };
        });

        this.totalProgressPercent = totalRequired > 0 ? Math.round((totalUploadedRequired / totalRequired) * 100) : 0;
    }

    getProgressBarColor(percent: number): 'primary' | 'accent' | 'warn' {
        if (percent === 100) return 'primary'; // Vert dans le thème
        if (percent >= 50) return 'accent'; // Orange
        return 'warn'; // Rouge
    }
}