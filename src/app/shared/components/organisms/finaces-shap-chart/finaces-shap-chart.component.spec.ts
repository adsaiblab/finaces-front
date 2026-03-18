import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesShapChartComponent, ShapFeature } from './finaces-shap-chart.component';

describe('FinacesShapChartComponent', () => {
    let component: FinacesShapChartComponent;
    let fixture: ComponentFixture<FinacesShapChartComponent>;

    const mockFeatures: ShapFeature[] = [
        { name: 'Feature A', rawValue: 10, shapValue: 0.5, direction: 'UP' },
        { name: 'Feature B', rawValue: 20, shapValue: -0.3, direction: 'DOWN' },
        { name: 'Feature C', rawValue: 30, shapValue: 0.1, direction: 'UP' },
    ];

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FinacesShapChartComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(FinacesShapChartComponent);
        component = fixture.componentInstance;

        // Strict input injection for OnPush
        fixture.componentRef.setInput('features', mockFeatures);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should slice features based on maxFeatures', () => {
        fixture.componentRef.setInput('maxFeatures', 2);
        fixture.detectChanges();

        // updateData is called via ngOnChanges natively in test environment
        expect(component.displayedFeatures.length).toBe(2);
    });

    it('should sort features by absolute SHAP value in descending order', () => {
        // Feature A (0.5), Feature B (0.3), Feature C (0.1)
        expect(component.displayedFeatures[0].name).toBe('Feature A');
        expect(component.displayedFeatures[1].name).toBe('Feature B');
        expect(component.displayedFeatures[2].name).toBe('Feature C');
    });

    it('should clear existing SVG before rendering new one', () => {
        // Force a render
        component['renderChart']();
        const container = fixture.nativeElement.querySelector('.shap-chart-container');
        const svgs = container.querySelectorAll('svg');
        expect(svgs.length).toBe(1); // Should only be 1 SVG even if called multiple times

        component['renderChart']();
        const svgsAfter = container.querySelectorAll('svg');
        expect(svgsAfter.length).toBe(1);
    });
});
