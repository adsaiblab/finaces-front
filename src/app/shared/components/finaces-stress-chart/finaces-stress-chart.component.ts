import {
    Component,
    Input,
    ChangeDetectionStrategy,
    OnChanges,
    SimpleChanges,
    ViewChild,
    ElementRef,
    AfterViewInit,
    OnDestroy,
    HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend,
    Filler,
    ChartConfiguration
} from 'chart.js';

// Tree-shaking: Enregistrer uniquement les modules nécessaires au lieu de 'registerables'
Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend,
    Filler
);

export interface ScenarioFlowSchema {
    month: number;
    openingCash: number;
    inflows: number;
    outflows: number;
    closingCash: number;
    label?: string;
}

export type SolventStatus = 'SOLVENT' | 'INSOLVENT';

@Component({
    selector: 'finaces-stress-chart',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    templateUrl: './finaces-stress-chart.component.html',
    styleUrls: ['./finaces-stress-chart.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinacesStressChartComponent implements OnChanges, AfterViewInit, OnDestroy {
    @Input({ required: true }) monthlyFlows: ScenarioFlowSchema[] = [];
    @Input() stress60dResult?: SolventStatus;
    @Input() stress90dResult?: SolventStatus;
    @Input() criticalMonth?: number;
    @Input() height: number = 250;

    @ViewChild('chartCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

    chart: Chart<'line'> | null = null;
    private isViewInit = false;

    @HostListener('window:resize')
    onResize() {
        if (this.chart) {
            this.chart.resize();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['monthlyFlows'] || changes['criticalMonth']) {
            if (this.isViewInit) {
                // requestAnimationFrame assure que le DOM (notamment la taille du canvas parent) est prêt
                requestAnimationFrame(() => this.renderChart());
            }
        }
    }

    ngAfterViewInit(): void {
        this.isViewInit = true;
        if (this.monthlyFlows && this.monthlyFlows.length > 0) {
            this.renderChart();
        }
    }

    private getCssVariable(varName: string): string {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }

    private renderChart(): void {
        const canvas = this.canvasRef.nativeElement;
        if (!canvas || !this.monthlyFlows.length) return;

        if (this.chart) {
            this.chart.destroy();
        }

        // Récupération des couleurs du Design System
        const colorPrimary = this.getCssVariable('--color-primary') || '#3B82F6';
        const colorError = this.getCssVariable('--color-error') || '#EF4444';
        const colorBgPrimary = `rgba(${this.hexToRgb(colorPrimary)}, 0.1)`;
        const colorTextPrimary = this.getCssVariable('--color-content-primary') || '#1E293B';
        const colorTextSecondary = this.getCssVariable('--color-content-secondary') || '#64748B';
        const colorBorder = this.getCssVariable('--color-border-default') || '#E2E8F0';
        const colorSurfaceCard = this.getCssVariable('--color-surface-card') || '#FFFFFF';

        const labels = this.monthlyFlows.map(f => `M${f.month}`);
        const data = this.monthlyFlows.map(f => f.closingCash);

        const minValue = Math.min(0, ...data);
        const maxValue = Math.max(0, ...data);
        const padding = (maxValue - minValue) * 0.15;

        const config: ChartConfiguration<'line'> = {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Trésorerie disponible',
                        data,
                        borderColor: colorPrimary,
                        backgroundColor: colorBgPrimary,
                        borderWidth: 2.5,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: colorPrimary,
                        pointBorderColor: colorSurfaceCard,
                        pointBorderWidth: 2,
                        tension: 0.3,
                        fill: true,
                        segment: {
                            borderColor: (ctx: any) => {
                                if (this.criticalMonth && Math.abs(ctx.p1DataIndex - this.criticalMonth) <= 1) {
                                    return colorError;
                                }
                                return colorPrimary;
                            }
                        }
                    },
                    {
                        label: 'Seuil critique',
                        data: new Array(labels.length).fill(0),
                        borderColor: colorError,
                        borderDash: [5, 5],
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        fill: false,
                        tension: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Important pour respecter le Input() height
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            color: colorTextSecondary,
                            font: { size: 12, weight: '500', family: 'inherit' }
                        }
                    },
                    tooltip: {
                        backgroundColor: colorTextPrimary, // Inversion pour contraste
                        titleColor: colorSurfaceCard,
                        bodyColor: colorSurfaceCard,
                        padding: 12,
                        borderColor: colorBorder,
                        borderWidth: 1,
                        cornerRadius: 6,
                        titleFont: { size: 13, weight: '600', family: 'inherit' },
                        bodyFont: { size: 12, family: 'inherit' },
                        callbacks: {
                            label: (context: any) => {
                                if (context.datasetIndex === 0) {
                                    return `Trésorerie: ${context.parsed.y.toLocaleString('fr-FR')} MAD`;
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        min: minValue - padding,
                        max: maxValue + padding,
                        grid: { color: colorBorder, drawTicks: false },
                        ticks: {
                            color: colorTextSecondary,
                            font: { size: 11, family: 'inherit' },
                            callback: (value: any) => value.toLocaleString('fr-FR')
                        },
                        title: {
                            display: true,
                            text: 'Trésorerie (devise locale)',
                            color: colorTextSecondary,
                            font: { size: 12, weight: '600', family: 'inherit' }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: colorTextSecondary, font: { size: 11, family: 'inherit' } },
                        title: {
                            display: true,
                            text: 'Mois de projection',
                            color: colorTextSecondary,
                            font: { size: 12, weight: '600', family: 'inherit' }
                        }
                    }
                }
            }
        };

        this.chart = new Chart(canvas, config);
    }

    // Utilitaire pour convertir l'hex primaire en RGB pour l'opacité (backgroundColor)
    private hexToRgb(hex: string): string {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '59, 130, 246';
    }

    ngOnDestroy(): void {
        if (this.chart) {
            this.chart.destroy();
        }
    }
}