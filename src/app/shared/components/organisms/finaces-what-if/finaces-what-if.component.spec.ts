import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesWhatIfComponent } from './finaces-what-if.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('FinacesWhatIfComponent', () => {
    let component: FinacesWhatIfComponent;
    let fixture: ComponentFixture<FinacesWhatIfComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FinacesWhatIfComponent, NoopAnimationsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(FinacesWhatIfComponent);
        component = fixture.componentInstance;

        fixture.componentRef.setInput('features', [
            { feature_name: 'Revenue', feature_value: '100', magnitude: 10 },
            { feature_name: 'EBITDA', feature_value: '20', magnitude: 5 }
        ]);
        fixture.detectChanges();
    });

    it('should create and extract top features', () => {
        expect(component).toBeTruthy();
        expect(component.topFeatures().length).toBe(2);
        expect(component.topFeatures()[0].feature_name).toBe('Revenue'); // Highest magnitude
    });

    it('should update adjustment and detect changes', () => {
        expect(component.hasAdjustments()).toBe(false);
        component.updateAdjustment('Revenue', 150);
        expect(component.hasAdjustments()).toBe(true);
        expect(component.adjustments()['Revenue']).toBe(150);
    });

    it('should emit simulation event', () => {
        const emitSpy = vi.spyOn(component.simulate, 'emit');
        component.updateAdjustment('EBITDA', 30);
        component.triggerSimulation();
        expect(emitSpy).toHaveBeenCalledWith({
            scenario_name: 'Custom User Simulation',
            parameter_overrides: { 'EBITDA': 30 }
        });
    });
});