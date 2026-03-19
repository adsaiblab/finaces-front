import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabIncomeStatementComponent } from './tab-income-statement.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('TabIncomeStatementComponent', () => {
    let component: TabIncomeStatementComponent;
    let fixture: ComponentFixture<TabIncomeStatementComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TabIncomeStatementComponent, NoopAnimationsModule]
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

    it('should calculate EBITDA correctly (Revenue - COGS - OpEx)', () => {
        component.pnlForm.patchValue({
            revenue: 100000,
            cogs: 40000,
            operatingExpenses: 20000,
            depreciationAmortization: 5000,
            interestExpense: 2000,
            taxes: 8000
        });

        // EBITDA = Revenue - COGS - OpEx = 100k - 40k - 20k = 40k
        expect(component.ebitda()).toBe(40000);
    });

    it('should calculate Net Income correctly (EBITDA - D&A - Interest - Taxes)', () => {
        component.pnlForm.patchValue({
            revenue: 100000,
            cogs: 40000,
            operatingExpenses: 20000,
            depreciationAmortization: 5000,
            interestExpense: 2000,
            taxes: 8000
        });

        // Net Income = EBITDA - D&A - Interest - Taxes = 40k - 5k - 2k - 8k = 25k
        expect(component.netIncome()).toBe(25000);
    });

    it('should emit pnlDataChange with correct netIncome and ebitda when form is valid', () => {
        const emitSpy = vi.spyOn(component.pnlDataChange, 'emit');

        component.pnlForm.patchValue({
            revenue: 50000,
            cogs: 10000,
            operatingExpenses: 5000,
            depreciationAmortization: 2000,
            interestExpense: 1000,
            taxes: 4000
        });

        // EBITDA = 50k - 10k - 5k = 35k, Net Income = 35k - 2k - 1k - 4k = 28k
        expect(emitSpy).toHaveBeenCalledWith({
            netIncome: 28000,
            ebitda: 35000,
            data: expect.any(Object)
        });
    });
});
