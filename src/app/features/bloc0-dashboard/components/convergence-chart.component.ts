import { Component, ChangeDetectionStrategy, input, viewChild, ElementRef, effect, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ConvergenceChartOut } from '../../../core/models/dashboard.model';
import Chart from 'chart.js/auto';

@Component({
    selector: 'app-convergence-chart',
    standalone: true,
    imports: [CommonModule, MatIconModule, DecimalPipe],
    templateUrl: './convergence-chart.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles: [`
    .chart-container {
      @apply bg-[var(--color-surface-card)] rounded-xl border border-[var(--color-border-default)] p-6;
    }
    canvas {
      width: 100% !important;
      max-height: 300px;
    }
  `]
})
export class ConvergenceChartComponent implements OnDestroy {
    readonly chartData = input.required<ConvergenceChartOut | null>();
    readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');

    private chartInstance?: Chart;

    constructor() {
        effect(() => {
            const data = this.chartData();
            const canvas = this.canvasRef();

            if (data && canvas) {
                this.renderChart(data, canvas.nativeElement);
            }
        });
    }

    private renderChart(data: ConvergenceChartOut, canvasEl: HTMLCanvasElement): void {
        // Règle d'or : Nettoyer l'instance précédente
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        // Récupération sécurisée des couleurs du Design System via variables CSS
        const mccColor = 'var(--color-success, #10B981)';
        const iaColor = 'var(--color-info, #3B82F6)';
        const alertColor = 'var(--color-error, #EF4444)';
        const textColor = 'var(--color-content-secondary, #6B7280)';
        const gridColor = 'var(--color-border-default, #E5E7EB)';

        // Formater les dates pour l'affichage (ex: "16 Mar")
        const formattedDates = data.dates.map(dateStr => {
            const d = new Date(dateStr);
            return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        });

        // Préparer les points rouges (Alertes)
        const alertPoints = data.mcc_scores.map((score, index) =>
            data.divergence_flags[index] ? alertColor : 'transparent'
        );

        this.chartInstance = new Chart(canvasEl, {
            type: 'line',
            data: {
                labels: formattedDates,
                datasets: [
                    {
                        label: 'MCC Score (Décision)',
                        data: data.mcc_scores,
                        borderColor: mccColor,
                        backgroundColor: mccColor,
                        borderWidth: 3,
                        tension: 0.3,
                        pointBackgroundColor: alertPoints,
                        pointRadius: data.divergence_flags.map(f => f ? 6 : 0),
                        pointHoverRadius: 8,
                        order: 1 // Règle MCC-R4 : MCC au premier plan
                    },
                    {
                        label: 'IA Challenge',
                        data: data.ia_scores,
                        borderColor: iaColor,
                        backgroundColor: iaColor,
                        borderWidth: 2,
                        borderDash: [5, 5], // Règle MCC-R2 : Ligne en tirets
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
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: { display: false }, // Légende custom dans le HTML
                    tooltip: {
                        callbacks: {
                            afterBody: (context) => {
                                const idx = context[0].dataIndex;
                                const isDivergent = data.divergence_flags[idx];
                                if (isDivergent) {
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
                            callback: function (value) {
                                if (value === 1) return 'FAIBLE (1)';
                                if (value === 2.5) return 'MODERE (2.5)';
                                if (value === 4) return 'ELEVE (4)';
                                if (value === 5) return 'CRITIQUE (5)';
                                return value;
                            }
                        },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: textColor },
                        grid: { display: false }
                    }
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