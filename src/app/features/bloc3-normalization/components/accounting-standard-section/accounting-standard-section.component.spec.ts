import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountingStandardSectionComponent } from './accounting-standard-section.component';
import { describe, it, expect, beforeEach } from 'vitest';
import { FinancialStatementNormalizedSchema } from '../../../../core/models';

describe('AccountingStandardSectionComponent', () => {
  let component: AccountingStandardSectionComponent;
  let fixture: ComponentFixture<AccountingStandardSectionComponent>;

  const mockData: FinancialStatementNormalizedSchema = {
    statement_id: '123',
    fiscal_year: 2023,
    normalized_revenue: 0,
    normalized_ebitda: 0,
    normalized_net_income: 0,
    normalized_working_capital: 0,
    normalized_cash_flow: 0,
    adjustments: [],
    confidence_score: 95,
    normalization_date: '2026-03-16T10:00:00Z',
    // Mocking standard parameters (which can be extended in the interface later)
    source_standard: 'MAROC CNC',
    applied_standard: 'IFRS',
    exchange_rate: 10.0,
    exchange_rate_date: '2026-03-16',
  } as any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountingStandardSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountingStandardSectionComponent);
    component = fixture.componentInstance;

    // Strict Input setting for OnPush
    fixture.componentRef.setInput('data', mockData);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the correct source and applied standards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('MAROC CNC');
    expect(compiled.textContent).toContain('IFRS');
  });
});
