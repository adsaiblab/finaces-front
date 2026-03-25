import { TestBed } from '@angular/core/testing';
import { TensionCalculatorService } from './tension-calculator.service';
import { describe, it, expect, beforeEach } from 'vitest';
import { ScoringMccSchema, TensionLevel } from '../../../core/models/scoring.model';
import { IAPredictionResult } from '../../../core/models/ia.model';

describe('TensionCalculatorService', () => {
    let service: TensionCalculatorService;

    const mockMcc: ScoringMccSchema = {
        case_id: '123',
        global_score: 3.0,
        risk_class: 'MODERATE',
        calculation_date: '',
        status: 'COMPUTED',
        pillars: [{ id: 'p1', name: 'Liquidity', score: 3.0, weight: 100, status: 'GOOD', key_drivers: [] }],
        recommendations: [],
        cross_analysis_alerts: []
    };

    const mockIa: IAPredictionResult = {
        case_id: '123',
        model_version: 'v1',
        prediction_timestamp: '',
        predicted_score: 3.0,
        predicted_risk_class: 'MODERATE',
        confidence_interval: { lower: 2.8, upper: 3.2 },
        model_performance: { auc_roc: 0.9, accuracy: 0.9, f1_score: 0.9 },
        shap_values: { base_value: 3, total_contribution: 0, features: [] },
        feature_importance: [],
        disclaimer: ''
    };

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [TensionCalculatorService] });
        service = TestBed.inject(TensionCalculatorService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return NONE when scores are identical', () => {
        const result = service.calculateTension(mockMcc, mockIa);
        expect(result.level).toBe(TensionLevel.NONE);
        expect(result.direction).toBe('FLAT');
        expect(result.requires_justification).toBe(false);
    });

    it('should return SEVERE when delta is >= 1.0', () => {
        const severeIa = { ...mockIa, predicted_score: 4.1, predicted_risk_class: 'LOW' };
        const result = service.calculateTension(mockMcc, severeIa);
        expect(result.level).toBe(TensionLevel.SEVERE);
        expect(result.direction).toBe('UP');
        expect(result.requires_justification).toBe(true);
    });

    it('should return MODERATE on class divergence even with small delta', () => {
        const modIa = { ...mockIa, predicted_score: 3.2, predicted_risk_class: 'HIGH' };
        const result = service.calculateTension(mockMcc, modIa);
        expect(result.level).toBe(TensionLevel.MODERATE);
        expect(result.class_divergence).toBe(true);
    });
});