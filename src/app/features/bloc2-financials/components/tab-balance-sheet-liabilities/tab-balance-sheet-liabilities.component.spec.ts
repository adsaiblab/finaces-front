import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabBalanceSheetLiabilitiesComponent } from './tab-balance-sheet-liabilities.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('TabBalanceSheetLiabilitiesComponent', () => {
    let component: TabBalanceSheetLiabilitiesComponent;
    let fixture: ComponentFixture<TabBalanceSheetLiabilitiesComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TabBalanceSheetLiabilitiesComponent, NoopAnimationsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(TabBalanceSheetLiabilitiesComponent);
        component = fixture.componentInstance;

        // Règle du Manifeste : setInput strict
        fixture.componentRef.setInput('year', 2023);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should calculate totalLiabilities correctly when form changes', () => {
        component.liabilitiesForm.patchValue({
            equity: { shareCapital: 50000, retainedEarnings: 10000 },
            nonCurrentLiabilities: { longTermDebt: 30000 },
            currentLiabilities: { shortTermDebt: 5000, accountsPayable: 15000 }
        });

        // Le signal totalLiabilities se met à jour automatiquement
        expect(component.totalLiabilities()).toBe(110000);
    });

    it('should emit liabilitiesDataChange when form is valid and changes', () => {
        const emitSpy = vi.spyOn(component.liabilitiesDataChange, 'emit');

        component.liabilitiesForm.patchValue({
            equity: { shareCapital: 10000, retainedEarnings: 0 },
            nonCurrentLiabilities: { longTermDebt: 0 },
            currentLiabilities: { shortTermDebt: 0, accountsPayable: 0 }
        });

        expect(emitSpy).toHaveBeenCalledWith({
            total: 10000,
            data: expect.any(Object)
        });
    });
});