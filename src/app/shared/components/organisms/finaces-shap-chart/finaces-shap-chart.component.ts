import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  HostListener,
  effect,
  inject,
  NgZone,
} from '@angular/core';

import * as d3 from 'd3';
import { ShapFeature } from '../../../../core/models/ia.model';

@Component({
  selector: 'app-finaces-shap-chart', // Prefix 'app-'
  standalone: true,
  imports: [],
  templateUrl: './finaces-shap-chart.component.html',
  styleUrls: ['./finaces-shap-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinacesShapChartComponent implements AfterViewInit, OnDestroy {
  private ngZone = inject(NgZone);

  public features = input.required<ShapFeature[]>();
  public maxFeatures = input<number>(10);
  public showValues = input<boolean>(true);
  public height = input<number>(300);

  public featureClick = output<ShapFeature>();

  @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef<HTMLDivElement>;

  private isViewInit = false;
  private displayedFeatures: ShapFeature[] = [];

  constructor() {
    effect(() => {
      const feats = this.features();
      const max = this.maxFeatures();

      if (feats) {
        this.displayedFeatures = [...feats]
          .sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value))
          .slice(0, max);

        if (this.isViewInit) {
          this.ngZone.runOutsideAngular(() => {
            requestAnimationFrame(() => this.renderChart());
          });
        }
      }
    });
  }

  @HostListener('window:resize')
  onResize() {
    if (this.isViewInit && this.displayedFeatures.length > 0) {
      this.ngZone.runOutsideAngular(() => {
        requestAnimationFrame(() => this.renderChart());
      });
    }
  }

  ngAfterViewInit(): void {
    this.isViewInit = true;
    if (this.displayedFeatures.length > 0) {
      this.ngZone.runOutsideAngular(() => {
        this.renderChart();
      });
    }
  }

  ngOnDestroy(): void {
    if (this.chartContainer?.nativeElement) {
      d3.select(this.chartContainer.nativeElement).selectAll('svg').remove();
    }
  }

  private getCssVar(varName: string): string {
    const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    // Fallback in case of D3 trying to parse empty strings during initial load
    if (!val) {
      if (varName.includes('error')) return '#ef4444';
      if (varName.includes('success')) return '#10b981';
      return '#94a3b8';
    }
    return val;
  }

  private renderChart(): void {
    const container = this.chartContainer.nativeElement;
    if (!container) return;

    const colorPos = this.getCssVar('--color-error');
    const colorNeg = this.getCssVar('--color-success');
    const colorAxis = this.getCssVar('--color-border-strong');
    const colorTextPrimary = this.getCssVar('--color-content-primary');
    const colorTextSecondary = this.getCssVar('--color-content-secondary');

    const width = container.clientWidth || 800;
    const leftMargin = width < 500 ? 100 : 150;
    const margin = { top: 30, right: 120, bottom: 20, left: leftMargin };
    const chartWidth = width - margin.left - margin.right;
    const barHeight = 32;
    const chartHeight = this.displayedFeatures.length * barHeight;
    const totalHeight = Math.max(chartHeight + margin.top + margin.bottom, this.height());

    d3.select(container).selectAll('svg').remove();

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', totalHeight)
      .attr('viewBox', `0 0 ${width} ${totalHeight}`)
      .attr('preserveAspectRatio', 'xMinYMin meet');

    const maxAbsValue = Math.max(
      0.01,
      ...this.displayedFeatures.map((f) => Math.abs(f.shap_value)),
    );

    const xScale = d3
      .scaleLinear()
      .domain([-maxAbsValue * 1.2, maxAbsValue * 1.2])
      .range([0, chartWidth]);

    const yScale = d3
      .scaleBand()
      .domain(this.displayedFeatures.map((_, i) => i.toString()))
      .range([0, chartHeight])
      .padding(0.3);

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    g.append('line')
      .attr('x1', xScale(0))
      .attr('x2', xScale(0))
      .attr('y1', -15)
      .attr('y2', chartHeight + 10)
      .attr('stroke', colorAxis)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,4');

    const xAxis = d3
      .axisTop(xScale)
      .ticks(5)
      .tickFormat((domainValue) => (domainValue as number).toFixed(2));

    const xAxisGroup = g.append('g').attr('class', 'shap-x-axis').call(xAxis);
    xAxisGroup.selectAll('path, line').attr('stroke', colorAxis);
    xAxisGroup.selectAll('text').attr('fill', colorTextSecondary).style('font-size', '11px');

    const barGroups = g
      .selectAll('g.bar-group')
      .data(this.displayedFeatures)
      .join('g')
      .attr('class', 'bar-group')
      .attr('transform', (_, i) => `translate(0, ${yScale(i.toString())!})`);

    barGroups
      .append('rect')
      .attr('class', 'shap-bar')
      .attr('x', (d) => Math.min(xScale(0), xScale(d.shap_value)))
      .attr('y', 0)
      .attr('width', (d) => Math.abs(xScale(d.shap_value) - xScale(0)))
      .attr('height', yScale.bandwidth())
      .attr('fill', (d) => (d.shap_value > 0 ? colorPos : colorNeg))
      .attr('rx', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d) => this.ngZone.run(() => this.featureClick.emit(d)))
      .append('title')
      .text(
        (d) => `${d.feature_name}\nValue: ${d.feature_value}\nSHAP: ${d.shap_value.toFixed(4)}`,
      );

    barGroups
      .append('text')
      .attr('x', -12)
      .attr('y', yScale.bandwidth() / 2)
      .attr('dy', '0.32em')
      .attr('text-anchor', 'end')
      .attr('fill', colorTextPrimary)
      .style('font-size', '12px')
      .style('font-weight', '500')
      .style('pointer-events', 'none')
      .text((d) =>
        width < 500 && d.feature_name.length > 12
          ? d.feature_name.substring(0, 10) + '...'
          : d.feature_name,
      );

    if (this.showValues()) {
      barGroups
        .append('text')
        .attr('x', (d) => xScale(d.shap_value) + (d.shap_value > 0 ? 8 : -8))
        .attr('y', yScale.bandwidth() / 2)
        .attr('dy', '0.32em')
        .attr('text-anchor', (d) => (d.shap_value > 0 ? 'start' : 'end'))
        .attr('fill', (d) => (d.shap_value > 0 ? colorPos : colorNeg))
        .style('font-size', '12px')
        .style('font-weight', '600')
        .style('pointer-events', 'none')
        .text((d) => `${d.shap_value > 0 ? '+' : ''}${d.shap_value.toFixed(2)}`);
    }
  }
}
