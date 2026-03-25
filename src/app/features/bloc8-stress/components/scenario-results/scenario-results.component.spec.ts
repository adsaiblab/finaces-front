import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScenarioResultsComponent } from './scenario-results.component';
import { describe, it, expect, beforeEach, beforeAll, vi, afterAll } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { StressScenarioResult } from '../../../../core/models/stress.model';

describe('ScenarioResultsComponent', () => {
    let component: ScenarioResultsComponent;
    let fixture: ComponentFixture<ScenarioResultsComponent>;

    const mockScenarios: StressScenarioResult[] = [
        {
            scenario_name: 'Baseline',
            description: 'Standard payment terms',
            min_cash_balance: 50000,
            months_in_negative: 0,
            status: 'RESILIENT',
            cash_curve: [50000, 60000, 70000]
        },
        {
            scenario_name: 'Stress 60D',
            description: '60 days payment delay',
            min_cash_balance: -10000,
            months_in_negative: 2,
            status: 'BREACH',
            cash_curve: [50000, -10000, 20000]
        }
    ];

    beforeAll(() => {
        vi.stubGlobal('ResizeObserver', class ResizeObserver {
            observe() { }
            unobserve() { }
            disconnect() { }
        });
        vi.stubGlobal('requestAnimationFrame', (cb: Function) => cb());
    });

    afterAll(() => {
        vi.unstubAllGlobals();
    });

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ScenarioResultsComponent, NoopAnimationsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(ScenarioResultsComponent);
        component = fixture.componentInstance;

        fixture.componentRef.setInput('scenarios', mockScenarios);
        fixture.detectChanges();
    });

    it('should create and set selected scenario properly', () => {
        expect(component).toBeTruthy();
        expect(component.selectedScenario()?.scenario_name).toBe('Baseline');
    });

    it('should map cash curve to chart flows', () => {
        const flows = component.chartFlows();
        expect(flows.length).toBe(3);
        expect(flows[1].closingCash).toBe(60000);
    });

    it('should return correct status classes', () => {
        expect(component.getStatusClass('RESILIENT')).toContain('var(--color-success)');
        expect(component.getStatusClass('BREACH')).toContain('var(--color-error)');
    });
});