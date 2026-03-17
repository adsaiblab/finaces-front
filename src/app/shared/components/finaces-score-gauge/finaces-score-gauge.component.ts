import { Component, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'finaces-score-gauge',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './finaces-score-gauge.component.html',
    styleUrls: ['./finaces-score-gauge.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinacesScoreGaugeComponent implements OnChanges {
    @Input({ required: true }) score: number = 0;
    @Input() size: number = 120; // Diamètre en pixels
    @Input() label: string = 'Score Global';
    @Input() suffix: string = '/100';
    @Input() iaVariant: boolean = false;

    readonly strokeWidth = 10;
    readonly radius = 50; // Pour un viewBox de 120x120, centre 60, rayon 50 -> rentre parfaitement
    readonly circumference = 2 * Math.PI * this.radius;

    dashoffset: number = this.circumference;
    colorClass: string = 'gauge-success';

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['score'] || changes['iaVariant']) {
            this.updateGauge();
        }
    }

    private updateGauge(): void {
        // 1. Sécuriser la valeur du score entre 0 et 100
        const clampedScore = Math.max(0, Math.min(100, this.score));

        // 2. Calculer le remplissage SVG
        const percentage = clampedScore / 100;
        this.dashoffset = this.circumference - (percentage * this.circumference);

        // 3. Déterminer la classe de couleur
        if (this.iaVariant) {
            this.colorClass = 'gauge-ia';
        } else if (clampedScore >= 80) {
            this.colorClass = 'gauge-success';
        } else if (clampedScore >= 50) {
            this.colorClass = 'gauge-warning';
        } else {
            this.colorClass = 'gauge-error';
        }
    }

    get gaugeStyle(): Record<string, string> {
        return {
            width: `${this.size}px`,
            height: `${this.size}px`
        };
    }

    get circleStyle(): Record<string, string | number> {
        return {
            'stroke-dasharray': this.circumference,
            'stroke-dashoffset': this.dashoffset
        };
    }
}