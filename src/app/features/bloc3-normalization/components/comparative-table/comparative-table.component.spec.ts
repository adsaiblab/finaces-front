import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComparativeTableComponent } from './comparative-table.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FinancialStatementNormalizedSchema } from '../../../../core/models';

describe('ComparativeTableComponent', () => {
    let component: ComparativeTableComponent;
    let fixture: ComponentFixture<ComparativeTableComponent>;

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
        normalized_bilan_actif: {
            liquid_assets: 1000,
            accounts_receivable: 2000,
            inventory: 3000,
            other_current_assets: 0,
            tangible_assets: 5000,
            intangible_assets: 0,
            financial_assets: 0,
            other_noncurrent_assets: 0
        }
    } as any;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ComparativeTableComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ComparativeTableComponent);
        component = fixture.componentInstance;

        // Strict Input setting for OnPush compliance
        fixture.componentRef.setInput('data', mockData);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return correct color classes for deltas', () => {
        expect(component.getDeltaColorClass(0)).toBe('text-success');
        expect(component.getDeltaColorClass(5)).toBe('text-warning');
        expect(component.getDeltaColorClass(-8)).toBe('text-warning');
        expect(component.getDeltaColorClass(15)).toBe('text-error');
        expect(component.getDeltaColorClass(-20)).toBe('text-error');
    });

    it('should emit rowClick event when a row with note delta is clicked', () => {
        const emitSpy = vi.spyOn(component.rowClick, 'emit');
        const mockRow = {
            id: 'test-row',
            label: 'Test Row',
            rawValue: 100,
            normalizedValue: 150,
            deltaAmount: 50,
            deltaPct: 50,
            note: 'Δ',
            indentLevel: 1
        };

        component.onRowClick(mockRow);
        expect(emitSpy).toHaveBeenCalledWith('test-row');
    });

    it('should NOT emit rowClick event when an OK row is clicked', () => {
        const emitSpy = vi.spyOn(component.rowClick, 'emit');
        const mockRow = {
            id: 'test-row-2',
            label: 'Test Row 2',
            rawValue: 100,
            normalizedValue: 100,
            deltaAmount: 0,
            deltaPct: 0,
            note: 'OK',
            indentLevel: 1
        };

        component.onRowClick(mockRow);
        expect(emitSpy).not.toHaveBeenCalled();
    });
});