import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { CaseService } from '../../core/services/case.service';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// RÈGLE MANIFESTE : Mock global de Chart.js pour que le rendu du composant enfant n'échoue pas dans JSDOM
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
        // Protection Canvas pour JSDOM
        HTMLCanvasElement.prototype.getContext = vi.fn() as any;

        // Création du mock strict des appels API
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

    it('devrait appeler les 4 méthodes du CaseService à l\'initialisation (via le pipe async)', () => {
        // Dans Angular, avec le pipe | async, les méthodes sont appelées dès la détection de changement
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