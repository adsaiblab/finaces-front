import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ZscoreCardComponent } from './zscore-card.component';
import { describe, it, expect, beforeEach } from 'vitest';
import { ZScoreGroup } from '../../../../core/models/ratio.model';

describe('ZscoreCardComponent', () => {
    let component: ZscoreCardComponent;
    let fixture: ComponentFixture<ZscoreCardComponent>;

    const mockDistress: ZScoreGroup = {
        z_score_altman: { current: 1.5, trend: [], benchmark_min: 0, benchmark_max: 0, status: 'RED', unit: 'ratio', variation_pct: 0 },
        z_score_zone: 'DISTRESS',
        formula_breakdown: { x1: 0.1, x2: 0.2, x3: 0.3, x4: 0.4 }
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ZscoreCardComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ZscoreCardComponent);
        component = fixture.componentInstance;

        fixture.componentRef.setInput('zscore', mockDistress);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should return correct color for DISTRESS zone', () => {
        expect(component.getIconColor()).toBe('text-[color:var(--color-error)]');
    });
});