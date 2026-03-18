import { Component, ChangeDetectionStrategy, input, viewChild, ElementRef, effect, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, DecimalPipe, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ConvergenceChartOut } from '../../../../core/models/dashboard.model';
import Chart from 'chart.js/auto';

@Component({
    selector: 'app-convergence-chart',
    standalone: true,
    imports: [CommonModule, MatIconModule, DecimalPipe],
    templateUrl: './convergence-chart.component.html',
    styleUrls: ['./convergence-chart.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConvergenceChartComponent implements OnDestroy {
    readonly chartData = input.required<ConvergenceChartOut | null>();
    readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');

    private chartInstance?: Chart;
    private readonly isBrowser: boolean;

    constructor(@Inject(PLATFORM_ID) platformId: Object) {
        this.isBrowser = isPlatformBrowser(platformId);

        effect(() => {
            const data = this.chartData();
            const canvas = this.canvasRef();

            if (this.isBrowser && data && canvas) {
                this.renderChart(data, canvas.nativeElement);
            }
        });
    }

    private renderChart(data: ConvergenceChartOut, canvasEl: HTMLCanvasElement): void {
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        // CORRECTIF JSDOM : Vérification stricte du type avant d'appeler .trim()
        const getCssVar = (name: string, fallback: string): string => {
            try {
                const val = getComputedStyle(document.documentElement).getPropertyValue(name);
                return val && typeof val === 'string' && val.trim() !== '' ? val.trim() : fallback;
            } catch (e) {
                return fallback;
            }
        };

        const mccColor   = getCssVar('--color-success', '#2B8A5A');   // var(--success) light
        const iaColor    = getCssVar('--color-info',    '#4A7A9E');   // var(--info) light
        const alertColor = getCssVar('--color-error',   '#BC3B3B');   // var(--error) light
        const textColor  = getCssVar('--color-content-secondary', '#5C6773');  // var(--text-secondary) light
        const gridColor  = getCssVar('--color-border-default',    '#E5E0D8');  // var(--border) light

        const formattedDates = data.dates.map(dateStr => {
            const d = new Date(dateStr);
            return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        });

        const alertPoints = data.mcc_scores.map((score, index) =>
            data.divergence_flags[index] ? alertColor : 'transparent'
        );
        const alertRadii = data.divergence_flags.map(f => f ? 6 : 0);

        this.chartInstance = new Chart(canvasEl, {
            type: 'line',
            data: {
                labels: formattedDates,
                datasets: [
                    {
                        label: 'MCC Score',
                        data: data.mcc_scores,
                        borderColor: mccColor,
                        backgroundColor: mccColor,
                        borderWidth: 3,
                        tension: 0.3,
                        pointBackgroundColor: alertPoints,
                        pointRadius: alertRadii,
                        pointHoverRadius: 8,
                        order: 1
                    },
                    {
                        label: 'IA Challenge',
                        data: data.ia_scores,
                        borderColor: iaColor,
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        tension: 0.3,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        order: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            afterBody: (context) => {
                                const idx = context[0].dataIndex;
                                if (data.divergence_flags[idx]) {
                                    const delta = Math.abs(data.mcc_scores[idx] - data.ia_scores[idx]);
                                    return `\n⚠️ Divergence: OUI (Δ=${delta.toFixed(1)})`;
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        min: 0,
                        max: 5,
                        ticks: {
                            color: textColor,
                            callback: (value) => {
                                if (value === 1) return 'FAIBLE';
                                if (value === 2.5) return 'MODERE';
                                if (value === 4) return 'ELEVE';
                                if (value === 5) return 'CRITIQUE';
                                return value;
                            }
                        },
                        grid: { color: gridColor }
                    },
                    x: { ticks: { color: textColor }, grid: { display: false } }
                }
            }
        });
    }

    ngOnDestroy(): void {
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }
    }
}