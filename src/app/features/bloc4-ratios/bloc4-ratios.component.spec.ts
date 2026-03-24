import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Bloc4RatiosComponent } from './bloc4-ratios.component';
import { ActivatedRoute } from '@angular/router';
import { RatioCalculationService } from './services/ratio-calculation.service';
import { CaseService } from '../../core/services/case.service';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('Bloc4RatiosComponent', () => {
    let component: Bloc4RatiosComponent;
    let fixture: ComponentFixture<Bloc4RatiosComponent>;

    const mockRatioService = {
        computeRatios: vi.fn().mockReturnValue(of({
            case_id: 'case-123',
            coherence_alerts: [],
            z_score: {
                z_score_zone: 'SAFE',
                z_score_altman: { current: 3.5, trend: [], benchmark_min: 0, benchmark_max: 0, status: 'GREEN', unit: 'ratio', variation_pct: 0 },
                formula_breakdown: { x1: 1, x2: 1, x3: 1, x4: 1 }
            }
        }))
    };

    const mockCaseService = {};

    const mockActivatedRoute = {
        snapshot: { paramMap: { get: () => 'case-123' } },
        parent: { snapshot: { paramMap: { get: () => 'case-123' } } }
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Bloc4RatiosComponent, NoopAnimationsModule],
            providers: [
                { provide: RatioCalculationService, useValue: mockRatioService },
                { provide: CaseService, useValue: mockCaseService },
                { provide: ActivatedRoute, useValue: mockActivatedRoute }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(Bloc4RatiosComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create and load ratios on init', () => {
        expect(component).toBeTruthy();
        expect(mockRatioService.computeRatios).toHaveBeenCalledWith('case-123');
        expect(component.isLoading()).toBe(false);
    });
});