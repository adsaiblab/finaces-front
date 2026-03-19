import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TabBalanceSheetAssetsComponent } from './tab-balance-sheet-assets.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('TabBalanceSheetAssetsComponent', () => {
    let component: TabBalanceSheetAssetsComponent;
    let fixture: ComponentFixture<TabBalanceSheetAssetsComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TabBalanceSheetAssetsComponent, NoopAnimationsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(TabBalanceSheetAssetsComponent);
        component = fixture.componentInstance;

        // Règle du Manifeste : setInput strict
        fixture.componentRef.setInput('year', 2023);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should calculate totalAssets correctly when form changes', () => {
        component.assetsForm.patchValue({
            currentAssets: { cash: 1000, accountsReceivable: 500, inventory: 0 },
            nonCurrentAssets: { propertyPlantEquipment: 2000, intangibleAssets: 0 }
        });

        // Le signal totalAssets se met à jour automatiquement via toSignal
        expect(component.totalAssets()).toBe(3500);
    });

    it('should emit assetsDataChange when form is valid and changes', () => {
        const emitSpy = vi.spyOn(component.assetsDataChange, 'emit');

        component.assetsForm.patchValue({
            currentAssets: { cash: 100, accountsReceivable: 0, inventory: 0 },
            nonCurrentAssets: { propertyPlantEquipment: 0, intangibleAssets: 0 }
        });

        expect(emitSpy).toHaveBeenCalledWith({
            total: 100,
            data: expect.any(Object)
        });
    });
});