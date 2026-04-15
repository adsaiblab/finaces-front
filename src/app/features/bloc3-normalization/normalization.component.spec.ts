import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NormalizationComponent } from './normalization.component';
import { CaseContextService } from '../../core/services/case-context.service';
import { CaseService } from '../../core/services/case.service';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FinancialStatementNormalizedSchema } from '../../core/models';

// ── Fixtures ────────────────────────────────────────────────────────────────

const mockNormalizedData: Partial<FinancialStatementNormalizedSchema> = {
  id: 'stmt-001',
  raw_statement_id: 'raw-001',
  fiscal_year: 2023,
  currency_original: 'MAD',
  currency_usd: 'USD',
  exchange_rate: 10,
  total_assets: 100000,
  total_assets_original: 1000000,
  equity: 40000,
  non_current_liabilities: 30000,
  current_liabilities: 30000,
  total_liabilities_and_equity: 100000,
  total_liabilities_and_equity_original: 1000000,
  revenue: 50000,
  revenue_original: 500000,
  ebitda: 12000,
  ebitda_original: 120000,
  net_income: 8000,
  net_income_original: 80000,
  operating_income: 10000,
  operating_income_original: 100000,
  operating_cash_flow: 9000,
  operating_cash_flow_original: 90000,
  is_consolidated: false,
  adjustments_count: 1,
  adjustments: [
    { line_item: 'intangible_assets', original_value: 100000, adjusted_value: 150000, delta: 50000, reason: 'IFRS 16', standard: 'IFRS' }
  ],
  coherence: {
    assets_liabilities_balanced: true,
    ebitda_coherent: true,
    cash_flow_coherent: false,
    coherence_score: 0.67,
  },
  ratio_readiness: {
    basic_ratios_ready: true,
    advanced_ratios_ready: false,
    missing_fields: ['accounts_payable', 'capex'],
  },
} as Partial<FinancialStatementNormalizedSchema>;

// ── Suite ────────────────────────────────────────────────────────────────────

describe('NormalizationComponent', () => {
  let component: NormalizationComponent;
  let fixture: ComponentFixture<NormalizationComponent>;

  const mockCaseService = {
    getNormalizedFinancials: vi.fn().mockReturnValue(of([])),
    normalizeFinancials: vi.fn().mockReturnValue(of([])),
    computeRatios: vi.fn().mockReturnValue(of([])),
  };

  const mockCaseContext = {
    caseId: signal('case-123'),
  };

  beforeEach(async () => {
    mockCaseService.getNormalizedFinancials.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [NormalizationComponent, NoopAnimationsModule],
      providers: [
        { provide: CaseService, useValue: mockCaseService },
        { provide: CaseContextService, useValue: mockCaseContext },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NormalizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load data on init', () => {
    expect(component).toBeTruthy();
    expect(mockCaseService.getNormalizedFinancials).toHaveBeenCalledWith('case-123');
    expect(component.isLoading()).toBe(false);
  });

  it('should display no data when API returns empty array', () => {
    expect(component.statements()).toEqual([]);
    expect(component.normalizedData()).toBeNull();
  });

  it('should select the latest fiscal year when data is loaded', async () => {
    mockCaseService.getNormalizedFinancials.mockReturnValue(
      of([
        { ...mockNormalizedData, fiscal_year: 2021 },
        { ...mockNormalizedData, fiscal_year: 2023 },
        { ...mockNormalizedData, fiscal_year: 2022 },
      ] as FinancialStatementNormalizedSchema[])
    );

    component.ngOnInit();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.selectedYear()).toBe(2023);
  });

  it('should display coherence data when coherence is present', async () => {
    mockCaseService.getNormalizedFinancials.mockReturnValue(
      of([mockNormalizedData] as FinancialStatementNormalizedSchema[])
    );

    component.ngOnInit();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.normalizedData()?.coherence?.assets_liabilities_balanced).toBe(true);
    expect(component.normalizedData()?.coherence?.coherence_score).toBe(0.67);
  });

  it('should display ratio readiness warning when advanced ratios are not ready', async () => {
    mockCaseService.getNormalizedFinancials.mockReturnValue(
      of([mockNormalizedData] as FinancialStatementNormalizedSchema[])
    );

    component.ngOnInit();
    await fixture.whenStable();
    fixture.detectChanges();

    const readiness = component.normalizedData()?.ratio_readiness;
    expect(readiness?.basic_ratios_ready).toBe(true);
    expect(readiness?.advanced_ratios_ready).toBe(false);
    expect(readiness?.missing_fields).toContain('accounts_payable');
  });

  it('should display adjustments list when adjustments are returned', async () => {
    mockCaseService.getNormalizedFinancials.mockReturnValue(
      of([mockNormalizedData] as FinancialStatementNormalizedSchema[])
    );

    component.ngOnInit();
    await fixture.whenStable();
    fixture.detectChanges();

    const adjustments = component.normalizedData()?.adjustments;
    expect(adjustments?.length).toBe(1);
    expect(adjustments?.[0].line_item).toBe('intangible_assets');
    expect(adjustments?.[0].standard).toBe('IFRS');
  });
});
