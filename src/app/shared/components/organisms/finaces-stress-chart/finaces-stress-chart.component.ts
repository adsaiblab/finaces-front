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

// Tree-shaking: enregistrer uniquement les modules nécessaires
Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

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
        if (this.chart) this.chart.resize();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['monthlyFlows'] || changes['criticalMonth']) {
            if (this.isViewInit) {
                requestAnimationFrame(() => this.renderChart());
            }
        }
    }

    ngAfterViewInit(): void {
        this.isViewInit = true;
        if (this.monthlyFlows?.length > 0) this.renderChart();
    }

    ngOnDestroy(): void {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    /**
     * Lit une CSS variable depuis le Design System.
     * VIO-03 FIX : Noms corrigés pour correspondre EXACTEMENT à _variables.scss.
     * Aucun fallback HEX — Dark Mode natif garanti.
     */
    private getCssVar(varName: string): string {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }

    private renderChart(): void {
        const canvas = this.canvasRef.nativeElement;
        if (!canvas || !this.monthlyFlows.length) return;

        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }

        // VIO-03 FIX: tokens corrigés → _variables.scss
        const colorPrimary = this.getCssVar('--primary');
        const colorError = this.getCssVar('--error');
        const colorTextPrimary = this.getCssVar('--text-primary');
        const colorTextSecondary = this.getCssVar('--text-secondary');
        const colorBorder = this.getCssVar('--border');
        const colorCard = this.getCssVar('--bg-card');

        // VIO-03 FIX: Utilisation native de color-mix au lieu d'un parsing HexToRgb hasardeux
        const colorBgPrimary = `color-mix(in srgb, ${colorPrimary} 10%, transparent)`;

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
                        pointBorderColor: colorCard,
                        pointBorderWidth: 2,
                        tension: 0.3,
                        fill: true,
                        segment: {
                            borderColor: (ctx: any) =>
                                this.criticalMonth && Math.abs(ctx.p1DataIndex - this.criticalMonth) <= 1
                                    ? colorError
                                    : colorPrimary
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
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            color: colorTextSecondary,
                            font: { size: 12, weight: 'normal', family: 'inherit' }
                        }
                    },
                    tooltip: {
                        backgroundColor: colorTextPrimary,
                        titleColor: colorCard,
                        bodyColor: colorCard,
                        padding: 12,
                        borderColor: colorBorder,
                        borderWidth: 1,
                        cornerRadius: 6,
                        titleFont: { size: 13, weight: 'bold', family: 'inherit' },
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
                            font: { size: 12, weight: 'bold', family: 'inherit' }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: colorTextSecondary, font: { size: 11, family: 'inherit' } },
                        title: {
                            display: true,
                            text: 'Mois de projection',
                            color: colorTextSecondary,
                            font: { size: 12, weight: 'bold', family: 'inherit' }
                        }
                    }
                }
            }
        };

        this.chart = new Chart(canvas, config);
    }
}
