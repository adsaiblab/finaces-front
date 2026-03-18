import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { CaseService } from '../../core/services/case.service';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// RÈGLE MANIFESTE : Mock global de Chart.js pour éviter les erreurs Canvas dans JSDOM
vi.mock('chart.js/auto', () => {
    return {
        default: class MockChart {
            constructor() { }
            destroy() { }
        }
    };
});

describe('DashboardComponent', () => {
    let component: DashboardComponent;
    let fixture: ComponentFixture<DashboardComponent>;
    let mockCaseService: any;

    beforeEach(async () => {
        HTMLCanvasElement.prototype.getContext = vi.fn() as any;

        mockCaseService = {
            getDashboardStats: vi.fn().mockReturnValue(of(null)),
            getRecentCases: vi.fn().mockReturnValue(of([])),
            getActiveTensionCases: vi.fn().mockReturnValue(of([])),
            getConvergenceChart: vi.fn().mockReturnValue(of(null))
        };

        await TestBed.configureTestingModule({
            imports: [DashboardComponent],
            providers: [
                provideRouter([]),
                { provide: CaseService, useValue: mockCaseService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(DashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('devrait créer le composant parent dashboard', () => {
        expect(component).toBeTruthy();
    });

    it('devrait appeler les 4 méthodes du CaseService à l\'initialisation', () => {
        expect(mockCaseService.getDashboardStats).toHaveBeenCalled();
        expect(mockCaseService.getRecentCases).toHaveBeenCalledWith(5);
        expect(mockCaseService.getActiveTensionCases).toHaveBeenCalled();
        expect(mockCaseService.getConvergenceChart).toHaveBeenCalledWith(30);
    });

    it('devrait afficher le titre du tableau de bord', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const title = compiled.querySelector('h1');
        expect(title?.textContent).toContain('FinaCES — Tableau de Bord');
    });
});