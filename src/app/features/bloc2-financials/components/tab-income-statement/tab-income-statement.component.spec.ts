import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabIncomeStatementComponent } from './tab-income-statement.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('TabIncomeStatementComponent', () => {
  let component: TabIncomeStatementComponent;
  let fixture: ComponentFixture<TabIncomeStatementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabIncomeStatementComponent, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(TabIncomeStatementComponent);
    component = fixture.componentInstance;

    // Règle du Manifeste OtherGuidance.md : setInput strict pour les composants OnPush
    fixture.componentRef.setInput('year', 2023);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should calculate EBITDA correctly', () => {
    component.pnlForm.patchValue({
      revenue: 100000,
      soldProduction: 0,
      otherOperatingIncome: 0,
      consumedPurchases: 40000,
      externalExpenses: 10000,
      personnelExpenses: 10000,
      taxesAndDuties: 0,
      depreciationAmortization: 5000,
      financialIncome: 0,
      financialExpenses: 2000,
      exceptionalIncome: 0,
      incomeTax: 8000,
    });

    // EBITDA = Revenue - Consumed - External - Personnel = 100k - 40k - 10k - 10k = 40k
    expect(component.ebitda()).toBe(40000);
  });

  it('should calculate Net Income correctly', () => {
    component.pnlForm.patchValue({
      revenue: 100000,
      soldProduction: 0,
      otherOperatingIncome: 0,
      consumedPurchases: 40000,
      externalExpenses: 10000,
      personnelExpenses: 10000,
      taxesAndDuties: 0,
      depreciationAmortization: 5000,
      financialIncome: 0,
      financialExpenses: 2000,
      exceptionalIncome: 0,
      incomeTax: 8000,
    });

    // Net Income = EBITDA - D&A - Interest - Taxes = 40k - 5k - 2k - 8k = 25k
    expect(component.netIncome()).toBe(25000);
  });

  it('should emit pnlDataChange with correct netIncome and ebitda when form is valid', () => {
    const emitSpy = vi.spyOn(component.pnlDataChange, 'emit');

    component.pnlForm.patchValue({
      revenue: 50000,
      soldProduction: 0,
      otherOperatingIncome: 0,
      consumedPurchases: 10000,
      externalExpenses: 5000,
      personnelExpenses: 0,
      taxesAndDuties: 0,
      depreciationAmortization: 2000,
      financialIncome: 0,
      financialExpenses: 1000,
      exceptionalIncome: 0,
      incomeTax: 4000,
    });

    // EBITDA = 50k - 10k - 5k = 35k, Net Income = 35k - 2k - 1k - 4k = 28k
    expect(emitSpy).toHaveBeenCalledWith({
      netIncome: 28000,
      ebitda: 35000,
      data: expect.any(Object),
    });
  });
});
