import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ScoringRecommendation } from '../../../../core/models/scoring.model';

@Component({
    selector: 'app-recommendations-section',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatIconModule],
    templateUrl: './recommendations-section.component.html',
    styleUrls: ['./recommendations-section.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecommendationsSectionComponent {
    public recommendations = input<ScoringRecommendation[]>([]);
    public crossAnalysisAlerts = input<string[]>([]);

    public getRecommendationIcon(type: string): string {
        switch (type) {
            case 'POSITIVE': return 'check_circle';
            case 'WARNING': return 'warning_amber';
            case 'CRITICAL': return 'error_outline';
            default: return 'info';
        }
    }

    public getRecommendationColorClass(type: string): string {
        switch (type) {
            case 'POSITIVE': return 'text-[color:var(--color-success)]';
            case 'WARNING': return 'text-[color:var(--color-warning)]';
            case 'CRITICAL': return 'text-[color:var(--color-error)]';
            default: return 'text-[color:var(--color-content-secondary)]';
        }
    }

    public getRecommendationBgClass(type: string): string {
        switch (type) {
            case 'POSITIVE': return 'bg-[color:var(--color-success)] bg-opacity-10 border-[color:var(--color-success)]';
            case 'WARNING': return 'bg-[color:var(--color-warning)] bg-opacity-10 border-[color:var(--color-warning)]';
            case 'CRITICAL': return 'bg-[color:var(--color-error)] bg-opacity-10 border-[color:var(--color-error)]';
            default: return 'bg-[color:var(--color-surface-default)] border-[color:var(--color-border-default)]';
        }
    }
}