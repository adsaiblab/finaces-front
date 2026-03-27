import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IaComponent } from './ia.component';
import { ActivatedRoute } from '@angular/router';
import { IaService } from '../../core/services/ia.service';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('IaComponent', () => {
    let component: IaComponent;
    let fixture: ComponentFixture<IaComponent>;

    const mockIaService = {
        getPrediction: vi.fn().mockReturnValue(of({
            case_id: 'case-123',
            predicted_score: 3.5,
            model_performance: { accuracy: 0.9 },
            confidence_interval: { lower: 3.0, upper: 4.0 },
            shap_values: { features: [] }
        })),
        simulateWhatIf: vi.fn().mockReturnValue(of({ predicted_score_if: 4.0 }))
    };

    const mockActivatedRoute = {
        snapshot: { paramMap: { get: () => 'case-123' } },
        parent: { snapshot: { paramMap: { get: () => 'case-123' } } }
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [IaComponent, NoopAnimationsModule],
            providers: [
                { provide: IaService, useValue: mockIaService },
                { provide: ActivatedRoute, useValue: mockActivatedRoute }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(IaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create and load prediction on init', () => {
        expect(component).toBeTruthy();
        expect(mockIaService.getPrediction).toHaveBeenCalledWith('case-123');
        expect(component.isLoading()).toBe(false);
    });

    it('should handle simulation and update temporary state', () => {
        component.onSimulate({ scenario_name: 'Test', parameter_overrides: {} });
        expect(mockIaService.simulateWhatIf).toHaveBeenCalled();
        expect(component.simulationScore()).toBe(4.0);
    });
});