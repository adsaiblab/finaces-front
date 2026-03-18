import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DecisionColumnComponent } from './decision-column.component';
import { GateDecisionSchema } from '../../../../core/models/gate.model';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('DecisionColumnComponent', () => {
    let component: DecisionColumnComponent;
    let fixture: ComponentFixture<DecisionColumnComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DecisionColumnComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(DecisionColumnComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('devrait créer le composant', () => {
        expect(component).toBeTruthy();
    });

    it('devrait afficher EN ATTENTE si pas de décision et non en cours dévaluation', () => {
        fixture.componentRef.setInput('decision', null);
        fixture.componentRef.setInput('isEvaluating', false);
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('.state-title')?.textContent).toContain('EN ATTENTE');
    });

    it('devrait afficher le spinner si en cours dévaluation', () => {
        fixture.componentRef.setInput('isEvaluating', true);
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('mat-spinner')).toBeTruthy();
        expect(compiled.querySelector('.state-title')?.textContent).toContain('Analyse en cours');
    });

    it('devrait émettre evaluate au clic sur le bouton', () => {
        const emitSpy = vi.spyOn(component.evaluate, 'emit');
        fixture.componentRef.setInput('decision', null);
        fixture.componentRef.setInput('isEvaluating', false);
        fixture.detectChanges();

        const button = fixture.nativeElement.querySelector('.action-btn') as HTMLButtonElement;
        button.click();
        expect(emitSpy).toHaveBeenCalled();
    });

    it('devrait afficher les flags si présents', () => {
        // CORRECTION APPLIQUÉE ICI : Ajout de audit_log: [] dans le mock
        const mockDecision: Partial<GateDecisionSchema> = {
            verdict: 'BLOQUÉ',
            blocking_reasons: ['Bilan manquant'],
            reserve_flags: [],
            audit_log: []
        };
        fixture.componentRef.setInput('decision', mockDecision as GateDecisionSchema);
        fixture.detectChanges();

        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelector('.flags-banner')).toBeTruthy();
        expect(compiled.querySelector('.flag-item.blocking')?.textContent).toContain('Bilan manquant');
    });
});