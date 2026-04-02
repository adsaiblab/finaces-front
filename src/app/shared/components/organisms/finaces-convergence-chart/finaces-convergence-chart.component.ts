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
  NgZone,
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
  ChartConfiguration,
} from 'chart.js';
import { ConvergenceDataPoint } from '../../../../core/models/ia-admin.model';

// Tree-shaking: register only necessary modules
Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
);

@Component({
  selector: 'app-finaces-convergence-chart',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './finaces-convergence-chart.component.html',
  styleUrls: ['./finaces-convergence-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinacesConvergenceChartComponent implements AfterViewInit, OnDestroy {
  private ngZone = inject(NgZone);

  public convergenceData = input<ConvergenceDataPoint[]>([]);
  public height = input<number>(280);

  // static: false — le canvas est dans un @if, il ne peut pas être résolu
  // avant ngAfterViewInit. static:true sur un @if = canvasRef toujours undefined.
  @ViewChild('convergenceCanvas', { static: false })
  canvasRef?: ElementRef<HTMLCanvasElement>;

  private chart: Chart<'line'> | null = null;
  private isViewInit = false;

  constructor() {
    effect(() => {
      const data = this.convergenceData();
      // Double-guard : isViewInit ET canvasRef disponible (canvas dans @if)
      if (this.isViewInit && this.canvasRef?.nativeElement) {
        this.ngZone.runOutsideAngular(() => {
          requestAnimationFrame(() => this.renderChart(data));
        });
      }
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.chart) {
      this.ngZone.runOutsideAngular(() => {
        this.chart!.resize();
      });
    }
  }

  ngAfterViewInit(): void {
    this.isViewInit = true;
    const data = this.convergenceData();
    if (data && data.length > 0 && this.canvasRef?.nativeElement) {
      this.ngZone.runOutsideAngular(() => {
        this.renderChart(data);
      });
    }
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private getCssVar(primaryVar: string, fallbackVar: string, hexFallback: string): string {
    const val1 = getComputedStyle(document.documentElement).getPropertyValue(primaryVar).trim();
    if (val1) return val1;
    const val2 = getComputedStyle(document.documentElement).getPropertyValue(fallbackVar).trim();
    if (val2) return val2;
    return hexFallback;
  }

  private renderChart(data: ConvergenceDataPoint[]): void {
    // Guard: canvasRef peut être undefined si convergenceData est vide (canvas dans @if)
    if (!this.canvasRef?.nativeElement || !data.length) return;

    const canvas = this.canvasRef.nativeElement;

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    const colorPrimary = this.getCssVar('--color-primary', '--primary', '#6366F1');
    const colorError = this.getCssVar('--color-error', '--error', '#EF4444');
    const colorTextSecondary = this.getCssVar(
      '--color-content-secondary',
      '--text-secondary',
      '#64748B',
    );
    const colorBorder = this.getCssVar('--color-border-default', '--border', '#E2E8F0');
    const colorCard = this.getCssVar('--color-surface-card', '--bg-card', '#FFFFFF');
    const colorTextPrimary = this.getCssVar('--color-content-primary', '--text-primary', '#1E293B');

    const labels = data.map((d) => `E${d.epoch}`);
    const trainLoss = data.map((d) => d.train_loss);
    const valLoss = data.map((d) => d.val_loss);

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Train Loss',
            data: trainLoss,
            borderColor: colorPrimary,
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            pointRadius: 2,
            pointHoverRadius: 5,
            pointBackgroundColor: colorPrimary,
            pointBorderColor: colorCard,
            pointBorderWidth: 1.5,
            tension: 0.3,
            fill: false,
          },
          {
            label: 'Validation Loss',
            data: valLoss,
            borderColor: colorError,
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            pointRadius: 2,
            pointHoverRadius: 5,
            pointBackgroundColor: colorError,
            pointBorderColor: colorCard,
            pointBorderWidth: 1.5,
            tension: 0.3,
            fill: false,
            borderDash: [4, 3],
          },
        ],
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
              font: { size: 12, weight: 'normal', family: 'inherit' },
            },
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
              label: (context) => {
                const label = context.dataset.label ?? '';
                const value = (context.parsed.y as number).toFixed(4);
                return `${label}: ${value}`;
              },
            },
          },
        },
        scales: {
          y: {
            grid: { color: colorBorder, drawTicks: false },
            ticks: {
              color: colorTextSecondary,
              font: { size: 11, family: 'inherit' },
              callback: (value) => (value as number).toFixed(3),
            },
            title: {
              display: true,
              text: 'Loss',
              color: colorTextSecondary,
              font: { size: 12, weight: 'bold', family: 'inherit' },
            },
          },
          x: {
            grid: { display: false },
            ticks: {
              color: colorTextSecondary,
              font: { size: 11, family: 'inherit' },
              maxTicksLimit: 10,
            },
            title: {
              display: true,
              text: 'Epoch',
              color: colorTextSecondary,
              font: { size: 12, weight: 'bold', family: 'inherit' },
            },
          },
        },
      },
    };

    this.chart = new Chart(canvas, config);
  }
}
