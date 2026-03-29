import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IaComponent } from './ia.component';
import { ActivatedRoute } from '@angular/router';
import { IaService } from '../../core/services/ia.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('IaComponent', () => {
    let component: IaComponent;
    let fixture: ComponentFixture<IaComponent>;

    const mockIaService = {
        getPrediction: vi.fn().mockReturnValue(of({
            id: 'pred-1',
            case_id: 'case-123',
            ia_score: 3.5,
            ia_risk_class: 'MODERATE',
            ia_probability_default: 0.12,
            threshold_info: '',
            predicted_at: '',
            predicted_score: 3.5,
            predicted_risk_class: 'MODERATE',
            confidence_interval: { lower: 3.0, upper: 4.0 },
            model_version: 'v2.4.1',
            prediction_timestamp: '',
            disclaimer: '',
            feature_importance: [],
            shap_values: { base_value: 3.0, total_contribution: 0.5, features: [] },
            explanations: { top_features: [], explanation_method: 'shap', base_value: 3.0 }
        })),
        getActiveModel: vi.fn().mockReturnValue(of({
            id: 'model-1',
            name: 'xgboost',
            version: 'v2.4.1',
            is_active: true,
            auc_roc: 0.89,
            accuracy: 0.9,
            f1_score: 0.82,
            confidence_interval: { lower: 0.85, upper: 0.93 },
            trained_at: ''
        })),
        simulateWhatIf: vi.fn().mockReturnValue(of({
            scenario_name: 'Test',
            predicted_score_if: 4.0,
            predicted_class_if: 'LOW',
            delta_score: 0.5,
            feature_impacts: []
        }))
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
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                { provide: MatSnackBar, useValue: { open: vi.fn() } }
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