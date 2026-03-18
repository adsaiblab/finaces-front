import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { CaseService } from '../../core/services/case.service';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ConvergenceChartOut } from '../../core/models/dashboard.model';

describe('DashboardComponent', () => {
    let component: DashboardComponent;
    let fixture: ComponentFixture<DashboardComponent>;
    let mockCaseService: any;

    const mockConvergenceData: ConvergenceChartOut = {
        dates: ['2026-03-01'],
        mcc_scores: [1],
        ia_scores: [1],
        divergence_flags: [false],
        correlation: 0.9,
        convergence_percentage: 90
    };

    beforeEach(async () => {
        // CORRECTIF JSDOM : Remplacement du vi.mock par des stubs natifs
        HTMLCanvasElement.prototype.getContext = vi.fn() as any;
        globalThis.ResizeObserver = class {
            observe() { }
            unobserve() { }
            disconnect() { }
        };

        mockCaseService = {
            getDashboardStats: vi.fn().mockReturnValue(of({})),
            getRecentCases: vi.fn().mockReturnValue(of([])),
            getConvergenceChart: vi.fn().mockReturnValue(of(mockConvergenceData)), // FIX: Renvoie un objet structuré valide
            getActiveTensionCases: vi.fn().mockReturnValue(of([]))
        };

        await TestBed.configureTestingModule({
            imports: [DashboardComponent],
            providers: [
                provideRouter([]),
                provideAnimations(),
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

    it('devrait créer le composant dashboard', () => {
        expect(component).toBeTruthy();
    });
});