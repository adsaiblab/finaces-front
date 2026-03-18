import {
    Component,
    Input,
    Output,
    EventEmitter,
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
import * as d3 from 'd3';

export interface ShapFeature {
    name: string;
    label?: string;
    rawValue: number;
    shapValue: number;
    direction: 'UP' | 'DOWN';
    group?: 'liquidity' | 'solvency' | 'profitability' | 'capacity' | 'quality';
}

@Component({
    selector: 'finaces-shap-chart',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './finaces-shap-chart.component.html',
    styleUrls: ['./finaces-shap-chart.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinacesShapChartComponent implements OnChanges, AfterViewInit, OnDestroy {
    @Input({ required: true }) features: ShapFeature[] = [];
    @Input() maxFeatures: number = 10;
    @Input() showValues: boolean = true;
    @Input() height: number = 300;

    @Output() featureClick = new EventEmitter<ShapFeature>();

    @ViewChild('chartContainer', { static: true }) chartContainer!: ElementRef<HTMLDivElement>;

    displayedFeatures: ShapFeature[] = [];
    private isViewInit = false;

    @HostListener('window:resize')
    onResize() {
        if (this.isViewInit && this.displayedFeatures.length > 0) {
            this.renderChart();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['features'] || changes['maxFeatures']) {
            this.updateData();
        }
    }

    ngAfterViewInit(): void {
        this.isViewInit = true;
        if (this.displayedFeatures.length > 0) {
            this.renderChart();
        }
    }

    // VIO-06 FIX: Nettoyage SVG à la destruction du composant
    ngOnDestroy(): void {
        if (this.chartContainer?.nativeElement) {
            d3.select(this.chartContainer.nativeElement).selectAll('svg').remove();
        }
    }

    private updateData(): void {
        if (!this.features) return;
        this.displayedFeatures = [...this.features]
            .sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue))
            .slice(0, this.maxFeatures);

        if (this.isViewInit) {
            requestAnimationFrame(() => this.renderChart());
        }
    }

    /**
     * Lit une CSS variable depuis le Design System.
     * VIO-02 FIX : Les noms de tokens correspondent EXACTEMENT à _variables.scss.
     * Aucun fallback HEX — si le token est absent, D3 n'aura pas de couleur en dur.
     */
    private getCssVar(varName: string): string {
        return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }

    private renderChart(): void {
        const container = this.chartContainer.nativeElement;
        if (!container) return;

        // VIO-02 FIX: Noms corrigés pour correspondre à _variables.scss
        const colorPos         = this.getCssVar('--error');           // barres positives SHAP (risque haut)
        const colorNeg         = this.getCssVar('--success');          // barres négatives SHAP (protecteur)
        const colorAxis        = this.getCssVar('--border-strong');
        const colorTextPrimary = this.getCssVar('--text-primary');
        const colorTextSecondary = this.getCssVar('--text-secondary');

        const width = container.clientWidth || 800;
        const leftMargin = width < 500 ? 100 : 150;
        const margin = { top: 30, right: 120, bottom: 20, left: leftMargin };
        const chartWidth = width - margin.left - margin.right;
        const barHeight = 32;
        const chartHeight = this.displayedFeatures.length * barHeight;
        const totalHeight = chartHeight + margin.top + margin.bottom;

        // Clear previous SVG
        d3.select(container).selectAll('svg').remove();

        const svg = d3.select(container)
            .append('svg')
            .attr('width', '100%')
            .attr('height', totalHeight)
            .attr('viewBox', `0 0 ${width} ${totalHeight}`)
            .attr('preserveAspectRatio', 'xMinYMin meet');

        const maxAbsValue = Math.max(0.01, ...this.displayedFeatures.map(f => Math.abs(f.shapValue)));

        const xScale = d3.scaleLinear()
            .domain([-maxAbsValue * 1.2, maxAbsValue * 1.2])
            .range([0, chartWidth]);

        const yScale = d3.scaleBand()
            .domain(this.displayedFeatures.map((_, i) => i.toString()))
            .range([0, chartHeight])
            .padding(0.3);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left}, ${margin.top})`);

        // Zero line
        g.append('line')
            .attr('x1', xScale(0)).attr('x2', xScale(0))
            .attr('y1', -15).attr('y2', chartHeight + 10)
            .attr('stroke', colorAxis)
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '4,4');

        // X-axis
        const xAxis = d3.axisTop(xScale)
            .ticks(5)
            .tickFormat((domainValue) => (domainValue as number).toFixed(2));

        const xAxisGroup = g.append('g').attr('class', 'shap-x-axis').call(xAxis);
        xAxisGroup.selectAll('path, line').attr('stroke', colorAxis);
        xAxisGroup.selectAll('text').attr('fill', colorTextSecondary).style('font-size', '11px');

        // Bar groups
        const barGroups = g.selectAll('g.bar-group')
            .data(this.displayedFeatures)
            .join('g')
            .attr('class', 'bar-group')
            .attr('transform', (_, i) => `translate(0, ${yScale(i.toString())!})`);

        barGroups.append('rect')
            .attr('class', 'shap-bar')
            .attr('x', d => Math.min(xScale(0), xScale(d.shapValue)))
            .attr('y', 0)
            .attr('width', d => Math.abs(xScale(d.shapValue) - xScale(0)))
            .attr('height', yScale.bandwidth())
            .attr('fill', d => d.shapValue > 0 ? colorPos : colorNeg)
            .attr('rx', 2)
            .style('cursor', 'pointer')
            .on('click', (event, d) => this.featureClick.emit(d))
            .append('title')
            .text(d => `${d.label || d.name}\nValeur brute: ${d.rawValue}\nSHAP: ${d.shapValue.toFixed(4)}`);

        // Left labels
        barGroups.append('text')
            .attr('x', -12).attr('y', yScale.bandwidth() / 2)
            .attr('dy', '0.32em').attr('text-anchor', 'end')
            .attr('fill', colorTextPrimary)
            .style('font-size', '12px').style('font-weight', '500').style('pointer-events', 'none')
            .text(d => width < 500 && d.name.length > 12 ? d.name.substring(0, 10) + '...' : d.name);

        // Right labels (SHAP values)
        if (this.showValues) {
            barGroups.append('text')
                .attr('x', d => xScale(d.shapValue) + (d.shapValue > 0 ? 8 : -8))
                .attr('y', yScale.bandwidth() / 2)
                .attr('dy', '0.32em')
                .attr('text-anchor', d => d.shapValue > 0 ? 'start' : 'end')
                .attr('fill', d => d.shapValue > 0 ? colorPos : colorNeg)
                .style('font-size', '12px').style('font-weight', '600').style('pointer-events', 'none')
                .text(d => `${d.shapValue > 0 ? '+' : ''}${d.shapValue.toFixed(2)}`);
        }
    }
}
