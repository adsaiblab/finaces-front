import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesShapChartComponent } from './finaces-shap-chart.component';
import { describe, it, expect, beforeEach, vi, afterAll } from 'vitest';
import { ShapFeature } from '../../../../core/models/ia.model';

describe('FinacesShapChartComponent', () => {
    let component: FinacesShapChartComponent;
    let fixture: ComponentFixture<FinacesShapChartComponent>;

    const mockFeatures: ShapFeature[] = [
        { feature_name: 'EBITDA Margin', feature_value: '15.2%', shap_value: -0.45, direction: 'negative', magnitude: 0.45 },
        { feature_name: 'Debt to Equity', feature_value: '2.5', shap_value: 0.85, direction: 'positive', magnitude: 0.85 }
    ];

    beforeEach(async () => {
        // Mock global API to prevent JSDOM issues with D3 animations
        vi.stubGlobal('requestAnimationFrame', (cb: Function) => cb());

        await TestBed.configureTestingModule({
            imports: [FinacesShapChartComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(FinacesShapChartComponent);
        component = fixture.componentInstance;

        fixture.componentRef.setInput('features', mockFeatures);
        fixture.detectChanges();
    });

    afterAll(() => {
        vi.unstubAllGlobals();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have the chart container', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const container = compiled.querySelector('.finaces-shap-chart-wrapper');
        expect(container).toBeTruthy();
    });
});