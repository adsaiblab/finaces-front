import { NgClass } from '@angular/common';
import {
    Component,
    ChangeDetectionStrategy,
    ViewChild,
    ElementRef,
    AfterViewInit,
    OnDestroy,
    HostListener,
    input,
    effect,
    inject,
    NgZone
} from '@angular/core';

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

// Tree-shaking: register only necessary modules
Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

export interface ScenarioFlowSchema {
    month: number;
    openingCash: number;
    inflows: number;
    outflows: number;
    closingCash: number;
    label?: string;
}

export type SolventStatus = 'RESILIENT' | 'MARGINAL' | 'BREACH'; // Updated to P15 English standards

@Component({
    selector: 'app-finaces-stress-chart', // Standard Angular prefix
    standalone: true,
    imports: [MatIconModule, NgClass],
    templateUrl: './finaces-stress-chart.component.html',
    styleUrls: ['./finaces-stress-chart.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinacesStressChartComponent implements AfterViewInit, OnDestroy {
    private ngZone = inject(NgZone);

    // Angular 17+ Signals replacing @Input
    public monthlyFlows = input<ScenarioFlowSchema[]>([]);
    public stress60dResult = input<SolventStatus | undefined>();
    public stress90dResult = input<SolventStatus | undefined>();
    public criticalMonth = input<number | undefined>();
    public height = input<number>(250);

    @ViewChild('chartCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

    private chart: Chart<'line'> | null = null;
    private isViewInit = false;

    constructor() {
        // Watch for data changes reactively via effect
        effect(() => {
            const flows = this.monthlyFlows();
            const critical = this.criticalMonth();

            if (this.isViewInit && flows) {
                this.ngZone.runOutsideAngular(() => {
                    requestAnimationFrame(() => this.renderChart(flows, critical));
                });
            }
        });
    }

    @HostListener('window:resize')
    onResize() {
        if (this.chart) {
            this.ngZone.runOutsideAngular(() => {
                this.chart!.resize();
            });
        }
    }

    ngAfterViewInit(): void {
        this.isViewInit = true;
        const flows = this.monthlyFlows();
        if (flows && flows.length > 0) {
            this.ngZone.runOutsideAngular(() => {
                this.renderChart(flows, this.criticalMonth());
            });
        }
    }

    ngOnDestroy(): void {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    /**
     * Reads a CSS variable from the Design System.
     * Tries the new FinaCES standard tokens first, falls back to the original ones to prevent regression.
     */
    private getCssVar(primaryVar: string, fallbackVar: string, hexFallback: string): string {
        const val1 = getComputedStyle(document.documentElement).getPropertyValue(primaryVar).trim();
        if (val1) return val1;
        const val2 = getComputedStyle(document.documentElement).getPropertyValue(fallbackVar).trim();
        if (val2) return val2;
        return hexFallback;
    }

    private renderChart(monthlyFlows: ScenarioFlowSchema[], criticalMonth: number | undefined): void {
        const canvas = this.canvasRef.nativeElement;
        if (!canvas || !monthlyFlows.length) return;

        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }

        // Mapping to FinaCES tokens with fallback to your original tokens
        const colorPrimary = this.getCssVar('--color-primary', '--primary', '#6366F1');
        const colorError = this.getCssVar('--color-error', '--error', '#EF4444');
        const colorTextPrimary = this.getCssVar('--color-content-primary', '--text-primary', '#1E293B');
        const colorTextSecondary = this.getCssVar('--color-content-secondary', '--text-secondary', '#64748B');
        const colorBorder = this.getCssVar('--color-border-default', '--border', '#E2E8F0');
        const colorCard = this.getCssVar('--color-surface-card', '--bg-card', '#FFFFFF');

        const colorBgPrimary = `color-mix(in srgb, ${colorPrimary} 10%, transparent)`;

        const labels = monthlyFlows.map(f => `M${f.month}`);
        const data = monthlyFlows.map(f => f.closingCash);
        const minValue = Math.min(0, ...data);
        const maxValue = Math.max(0, ...data);
        const padding = (maxValue - minValue) * 0.15;

        const config: ChartConfiguration<'line'> = {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Available Cash',
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
                                criticalMonth && Math.abs(ctx.p1DataIndex - (criticalMonth - 1)) <= 1
                                    ? colorError
                                    : colorPrimary
                        }
                    },
                    {
                        label: 'Critical Threshold',
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
                                    return `Cash: ${context.parsed.y.toLocaleString('en-US')} MAD`;
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
                            callback: (value: any) => value.toLocaleString('en-US')
                        },
                        title: {
                            display: true,
                            text: 'Cash Balance (Local Currency)',
                            color: colorTextSecondary,
                            font: { size: 12, weight: 'bold', family: 'inherit' }
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: colorTextSecondary, font: { size: 11, family: 'inherit' } },
                        title: {
                            display: true,
                            text: 'Projection Month',
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