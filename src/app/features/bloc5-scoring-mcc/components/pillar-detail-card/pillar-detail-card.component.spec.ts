import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PillarDetailCardComponent } from './pillar-detail-card.component';
import { describe, it, expect, beforeEach } from 'vitest';
import { PillarScore } from '../../../../core/models/scoring.model';

describe('PillarDetailCardComponent', () => {
    let component: PillarDetailCardComponent;
    let fixture: ComponentFixture<PillarDetailCardComponent>;

    const mockPillar: PillarScore = {
        id: 'p1',
        name: 'Liquidity',
        score: 4.2,
        weight: 20,
        status: 'GOOD',
        key_drivers: ['Strong Current Ratio', 'Low WCR']
    };

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PillarDetailCardComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(PillarDetailCardComponent);
        component = fixture.componentInstance;

        // Strict Input setting for OnPush compliance
        fixture.componentRef.setInput('pillar', mockPillar);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should format color correctly based on status', () => {
        expect(component.getStatusColor()).toBe('text-[color:var(--color-success)]');
    });

    it('should display the pillar name and score', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.textContent).toContain('Liquidity');
        expect(compiled.textContent).toContain('4.2');
    });
});