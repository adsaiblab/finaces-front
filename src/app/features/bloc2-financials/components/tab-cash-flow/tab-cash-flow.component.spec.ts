import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabCashFlowComponent } from './tab-cash-flow.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('TabCashFlowComponent', () => {
    let component: TabCashFlowComponent;
    let fixture: ComponentFixture<TabCashFlowComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TabCashFlowComponent, NoopAnimationsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(TabCashFlowComponent);
        component = fixture.componentInstance;

        // Règle du Manifeste : setInput strict
        fixture.componentRef.setInput('year', 2023);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should calculate netCashFlow correctly when form changes (including negative flows)', () => {
        component.cashFlowForm.patchValue({
            operatingActivities: 25000,
            investingActivities: -15000, // Investissement sortant
            financingActivities: -2000   // Remboursement de dette
        });

        // Le signal netCashFlow se met à jour automatiquement
        expect(component.netCashFlow()).toBe(8000);
    });

    it('should emit cashFlowDataChange when form is valid and changes', () => {
        const emitSpy = vi.spyOn(component.cashFlowDataChange, 'emit');

        component.cashFlowForm.patchValue({
            operatingActivities: 1000,
            investingActivities: 0,
            financingActivities: 0
        });

        expect(emitSpy).toHaveBeenCalledWith({
            netCashFlow: 1000,
            data: expect.any(Object)
        });
    });
});