import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecommendationsSectionComponent } from './recommendations-section.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('RecommendationsSectionComponent', () => {
    let component: RecommendationsSectionComponent;
    let fixture: ComponentFixture<RecommendationsSectionComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RecommendationsSectionComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(RecommendationsSectionComponent);
        component = fixture.componentInstance;

        fixture.componentRef.setInput('recommendations', [
            { id: '1', type: 'WARNING', message: 'Monitor liquidity closely.' }
        ]);
        fixture.componentRef.setInput('crossAnalysisAlerts', [
            'Discrepancy between strong profitability and weak cash flow.'
        ]);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should resolve correct icon and color for WARNING type', () => {
        expect(component.getRecommendationIcon('WARNING')).toBe('warning_amber');
        expect(component.getRecommendationColorClass('WARNING')).toBe('text-[color:var(--color-warning)]');
    });
});