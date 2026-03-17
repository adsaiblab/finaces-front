import {
    Component,
    Input,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
    OnChanges,
    SimpleChanges,
    ChangeDetectorRef,
    NgZone,
    OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type GaugeSize = 80 | 120 | 160;

interface GaugeMetrics {
    size: number;
    cx: number;
    cy: number;
    radius: number;
    arcRadius: number;
}

@Component({
    selector: 'finaces-score-gauge',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './finaces-score-gauge.component.html',
    styleUrls: ['./finaces-score-gauge.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinacesScoreGaugeComponent implements OnChanges, OnDestroy {
    @Input({ required: true }) score: number = 0;
    @Input() maxScore: number = 5;
    @Input() rail: 'MCC' | 'IA' = 'MCC';
    @Input() riskClass?: string;
    @Input() size: GaugeSize = 120;
    @Input() animated: boolean = true;
    @Input() showLabel: boolean = true;

    @Output() rendered = new EventEmitter<void>();

    metrics!: GaugeMetrics;
    arcPath: string = '';
    backgroundColor: string = 'var(--color-border-default)';
    arcColorClass: string = 'gauge-warning';
    displayScore: number = 0;
    displayScoreStr: string = '0.0';
    animationId: number | null = null;

    private readonly startAngle = -135;
    private readonly totalArcAngle = 270;

    constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {
        this.initializeMetrics(120);
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['size']) {
            this.initializeMetrics(this.size);
        }

        if (changes['score'] || changes['riskClass'] || changes['rail'] || changes['size']) {
            this.updateArcColor();
            this.updateBackground();
            this.startAnimation();
        }
    }

    private initializeMetrics(size: GaugeSize): void {
        const padding = size / 10;
        this.metrics = {
            size,
            cx: size / 2,
            cy: size / 2,
            radius: size / 2 - padding,
            arcRadius: (size / 2 - padding) * 0.75
        };
    }

    private updateArcColor(): void {
        const risk = this.riskClass?.toUpperCase() || 'MODERATE';
        if (this.rail === 'IA') {
            this.arcColorClass = 'gauge-ia';
        } else {
            const map: Record<string, string> = {
                LOW: 'gauge-success',
                MODERATE: 'gauge-warning',
                HIGH: 'gauge-orange',
                CRITICAL: 'gauge-error'
            };
            this.arcColorClass = map[risk] || 'gauge-warning';
        }
    }

    private updateBackground(): void {
        if (!this.metrics) return;
        const { cx, cy, arcRadius } = this.metrics;
        const startRad = this.degToRad(this.startAngle);
        const endRad = this.degToRad(this.startAngle + this.totalArcAngle);
        const x1 = cx + arcRadius * Math.cos(startRad);
        const y1 = cy + arcRadius * Math.sin(startRad);
        const x2 = cx + arcRadius * Math.cos(endRad);
        const y2 = cy + arcRadius * Math.sin(endRad);
        const largeArc = this.totalArcAngle > 180 ? 1 : 0;
        this.arcPath = `M ${x1} ${y1} A ${arcRadius} ${arcRadius} 0 ${largeArc} 1 ${x2} ${y2}`;
    }

    private startAnimation(): void {
        if (this.animationId !== null) cancelAnimationFrame(this.animationId);

        // Sécurisation Math
        const safeScore = Math.max(0, Math.min(this.score, this.maxScore));

        if (!this.animated) {
            this.displayScore = safeScore;
            this.displayScoreStr = safeScore.toFixed(1);
            this.cdr.markForCheck();
            this.rendered.emit();
            return;
        }

        const startTime = performance.now();
        const duration = 800;
        const startScore = 0;

        const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing simple (ease-out cubic)
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            this.displayScore = startScore + (safeScore - startScore) * easeProgress;
            this.displayScoreStr = this.displayScore.toFixed(1);
            this.cdr.markForCheck();

            if (progress < 1) {
                this.animationId = requestAnimationFrame(animate);
            } else {
                this.animationId = null;
                this.rendered.emit();
            }
        };

        this.ngZone.runOutsideAngular(() => {
            this.animationId = requestAnimationFrame(animate);
        });
    }

    private degToRad(deg: number): number {
        return (deg * Math.PI) / 180;
    }

    getProgressPath(): string {
        if (!this.metrics) return '';
        const { cx, cy, arcRadius } = this.metrics;

        // Protection contre division par zero et dépassement
        const safeMax = Math.max(0.1, this.maxScore);
        const progressPercent = Math.max(0, Math.min(1, this.displayScore / safeMax));

        const angleSpan = this.totalArcAngle * progressPercent;
        if (angleSpan <= 0.1) return ''; // Pas de path si score à 0

        const endAngle = this.startAngle + angleSpan;
        const startRad = this.degToRad(this.startAngle);
        const endRad = this.degToRad(endAngle);

        const x1 = cx + arcRadius * Math.cos(startRad);
        const y1 = cy + arcRadius * Math.sin(startRad);
        const x2 = cx + arcRadius * Math.cos(endRad);
        const y2 = cy + arcRadius * Math.sin(endRad);
        const largeArc = angleSpan > 180 ? 1 : 0;

        return `M ${x1} ${y1} A ${arcRadius} ${arcRadius} 0 ${largeArc} 1 ${x2} ${y2}`;
    }

    ngOnDestroy(): void {
        if (this.animationId !== null) cancelAnimationFrame(this.animationId);
    }
}