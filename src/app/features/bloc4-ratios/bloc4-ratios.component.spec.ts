import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Bloc4RatiosComponent } from './bloc4-ratios.component';
import { CaseContextService } from '../../core/services/case-context.service';
import { RatioCalculationService } from './services/ratio-calculation.service';
import { CaseService } from '../../core/services/case.service';
import { FinancialYearService } from '../../core/services/financial-year.service';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { CrossPillarAlertsComponent } from './components/cross-pillar-alerts/cross-pillar-alerts.component';

describe('Bloc4RatiosComponent', () => {
  let component: Bloc4RatiosComponent;
  let fixture: ComponentFixture<Bloc4RatiosComponent>;

  const mockRatioGrouped = {
    case_id: 'case-123',
    fiscal_year: 2023,
    coherence_alerts: [],
    cross_pillar_alerts: [],
    coherence_status: 'CLEAN',
    calculation_date: '',
    normalization_source: '',
    sector_code: '',
    liquidity: {} as any,
    solvency: {} as any,
    profitability: {} as any,
    capacity: {} as any,
    z_score: {
      z_score_zone: 'SAFE',
      z_score_altman: {
        current: 3.5,
        trend: [],
        benchmark_min: 0,
        benchmark_max: 0,
        status: 'GREEN',
        unit: 'ratio',
        variation_pct: 0,
      },
      formula_breakdown: { x1: 1, x2: 1, x3: 1, x4: 1 },
    },
  };

  const mockRatioService = {
    computeRatios: vi.fn().mockReturnValue(
      of({
        years: [2023],
        ratiosByYear: new Map([[2023, mockRatioGrouped]]),
      }),
    ),
  };

  const mockCaseService = {};

  const mockFinancialYearService = {
    loadAvailableYears: vi.fn().mockReturnValue(of([2023])),
  };

  const mockCaseContext = {
    caseId: () => 'case-123',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Bloc4RatiosComponent, CrossPillarAlertsComponent, NoopAnimationsModule],
      providers: [
        { provide: RatioCalculationService, useValue: mockRatioService },
        { provide: CaseService, useValue: mockCaseService },
        { provide: CaseContextService, useValue: mockCaseContext },
        { provide: FinancialYearService, useValue: mockFinancialYearService },
      ],
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
