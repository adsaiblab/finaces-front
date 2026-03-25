import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesStressChartComponent, ScenarioFlowSchema } from './finaces-stress-chart.component';
import { describe, it, expect, beforeEach, beforeAll, vi, afterAll } from 'vitest';

describe('FinacesStressChartComponent', () => {
    let component: FinacesStressChartComponent;
    let fixture: ComponentFixture<FinacesStressChartComponent>;

    const mockFlows: ScenarioFlowSchema[] = [
        { month: 1, openingCash: 10000, inflows: 5000, outflows: 3000, closingCash: 12000 },
        { month: 2, openingCash: 12000, inflows: 4000, outflows: 5000, closingCash: 11000 },
        { month: 3, openingCash: 11000, inflows: 3000, outflows: 6000, closingCash: 8000 }
    ];

    beforeAll(() => {
        vi.stubGlobal('ResizeObserver', class ResizeObserver {
            observe() { }
            unobserve() { }
            disconnect() { }
        });
        // Stub requestAnimationFrame for Chart.js rendering in JSDOM
        vi.stubGlobal('requestAnimationFrame', (cb: Function) => cb());
    });

    afterAll(() => {
        vi.unstubAllGlobals();
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FinacesStressChartComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(FinacesStressChartComponent);
        component = fixture.componentInstance;

        // Strict input setting
        fixture.componentRef.setInput('monthlyFlows', mockFlows);
        fixture.componentRef.setInput('height', 250);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should format labels as M(month_number)', () => {
        // Accessing private property chart for testing purpose
        const chartInstance = (component as any).chart;
        expect(chartInstance).toBeTruthy();
        expect(chartInstance.data.labels).toEqual(['M1', 'M2', 'M3']);
    });

    it('should display stress results badges when status is provided', () => {
        fixture.componentRef.setInput('stress60dResult', 'RESILIENT');
        fixture.componentRef.setInput('stress90dResult', 'BREACH');
        fixture.detectChanges();

        const results = fixture.nativeElement.querySelectorAll('.stress-result');
        expect(results.length).toBe(2);
        expect(results[0].textContent).toContain('RESILIENT');
        expect(results[1].textContent).toContain('BREACH');
    });

    it('should clean up chart on component destroy', () => {
        expect((component as any).chart).toBeTruthy();

        const destroySpy = vi.spyOn((component as any).chart, 'destroy');
        component.ngOnDestroy();
        expect(destroySpy).toHaveBeenCalled();
    });
});