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
    readonly radius = 50; // Base de calcul pour le SVG viewBox
    readonly circumference = 2 * Math.PI * this.radius;

    dashoffset: number = this.circumference;
    colorClass: string = 'gauge-success';

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['score']) {
            this.updateGauge();
        }
    }

    private updateGauge(): void {
        const clampedScore = Math.max(0, Math.min(100, this.score));

        // Calcul de l'arc (dashoffset) : 100 -> 0 offset, 0 -> full offset
        const percentage = clampedScore / 100;
        this.dashoffset = this.circumference - percentage * this.circumference;

        // Détermination de la classe couleur
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

    get gaugeStyle() {
        return {
            width: `${this.size}px`,
            height: `${this.size}px`
        };
    }

    get circleStyle() {
        return {
            strokeDasharray: this.circumference,
            strokeDashoffset: this.dashoffset
        };
    }
}