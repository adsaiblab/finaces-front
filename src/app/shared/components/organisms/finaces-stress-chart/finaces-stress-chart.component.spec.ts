import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesStressChartComponent, ScenarioFlowSchema } from './finaces-stress-chart.component';
import { vi } from 'vitest';

describe('FinacesStressChartComponent', () => {
    let component: FinacesStressChartComponent;
    let fixture: ComponentFixture<FinacesStressChartComponent>;

    const mockFlows: ScenarioFlowSchema[] = [
        { month: 1, openingCash: 10000, inflows: 5000, outflows: 3000, closingCash: 12000 },
        { month: 2, openingCash: 12000, inflows: 4000, outflows: 5000, closingCash: 11000 },
        { month: 3, openingCash: 11000, inflows: 3000, outflows: 6000, closingCash: 8000 }
    ];

    beforeAll(() => {
        // Utilisation de vi.stubGlobal (propre à Vitest) au lieu de 'global' (NodeJS)
        vi.stubGlobal('ResizeObserver', class ResizeObserver {
            observe() { }
            unobserve() { }
            disconnect() { }
        });
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FinacesStressChartComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(FinacesStressChartComponent);
        component = fixture.componentInstance;

        fixture.componentRef.setInput('monthlyFlows', mockFlows);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should format labels as M(month_number)', () => {
        // Force render synchronously for testing
        component['renderChart']();
        expect(component.chart).toBeTruthy();
        expect(component.chart?.data.labels).toEqual(['M1', 'M2', 'M3']);
    });

    it('should display stress results badges when status is provided', () => {
        fixture.componentRef.setInput('stress60dResult', 'SOLVENT');
        fixture.componentRef.setInput('stress90dResult', 'INSOLVENT');
        fixture.detectChanges();

        const results = fixture.nativeElement.querySelectorAll('.stress-result');
        expect(results.length).toBe(2);
        expect(results[0].textContent).toContain('SOLVENT');
        expect(results[1].textContent).toContain('INSOLVENT');
    });

    it('should clean up chart on component destroy', () => {
        component['renderChart']();
        expect(component.chart).toBeTruthy();

        const destroySpy = vi.spyOn(component.chart as any, 'destroy');
        component.ngOnDestroy();
        expect(destroySpy).toHaveBeenCalled();
    });
});
