import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConvergenceChartComponent } from './convergence-chart.component';
import { ConvergenceChartOut } from '../../../../core/models/dashboard.model';
import { ThemeService } from '../../../../core/services/theme/theme.service';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('ConvergenceChartComponent', () => {
    let component: ConvergenceChartComponent;
    let fixture: ComponentFixture<ConvergenceChartComponent>;

    const mockData: ConvergenceChartOut = {
        dates: ['2026-03-01', '2026-03-02'],
        mcc_scores: [2, 4],
        ia_scores: [2.1, 2],
        divergence_flags: [false, true],
        correlation: 0.85,
        convergence_percentage: 92
    };

    beforeEach(async () => {
        // Re-assign ResizeObserver as a class (required by Angular CDK new ResizeObserver())
        globalThis.ResizeObserver = class {
            observe = vi.fn();
            unobserve = vi.fn();
            disconnect = vi.fn();
        } as any;

        await TestBed.configureTestingModule({
            imports: [ConvergenceChartComponent],
            providers: [
                {
                    provide: ThemeService,
                    useValue: { isDarkMode: () => false, toggleTheme: vi.fn() }
                },
                { provide: PLATFORM_ID, useValue: 'browser' }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ConvergenceChartComponent);
        component = fixture.componentInstance;
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('devrait créer le composant', () => {
        fixture.componentRef.setInput('chartData', null);
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('devrait afficher l\'état vide si chartData est null', () => {
        fixture.componentRef.setInput('chartData', null);
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('.empty-state')).toBeTruthy();
        expect(compiled.textContent).toContain('No data');
    });

    it('devrait afficher le canvas et les stats si chartData est fourni', () => {
        fixture.componentRef.setInput('chartData', mockData);
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        // jsdom ne supporte pas le rendu Canvas, on vérifie le wrapper et les stats
        expect(compiled.querySelector('.canvas-wrapper')).toBeTruthy();
        expect(compiled.querySelector('.custom-legend')).toBeTruthy();
    });
});