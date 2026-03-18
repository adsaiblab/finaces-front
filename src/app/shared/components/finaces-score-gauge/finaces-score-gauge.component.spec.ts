// Manifeste §3: import obligatoire pour fakeAsync sous Vitest + Zone.js
import 'zone.js/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesScoreGaugeComponent } from './finaces-score-gauge.component';
import { vi, afterEach } from 'vitest';

describe('FinacesScoreGaugeComponent', () => {
    let component: FinacesScoreGaugeComponent;
    let fixture: ComponentFixture<FinacesScoreGaugeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FinacesScoreGaugeComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(FinacesScoreGaugeComponent);
        component = fixture.componentInstance;
        // Input requis avant le premier detectChanges
        fixture.componentRef.setInput('score', 0);
        fixture.detectChanges();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should create with default size 120', () => {
        expect(component).toBeTruthy();
        expect(component.metrics.size).toBe(120);
    });

    it('should start displayScore at 0 before animation completes', () => {
        // Le score est 0 au début (avant tout rAF)
        expect(component.displayScore).toBe(0);
    });

    it('should set displayScore immediately when animated is false', () => {
        // Sans animation, le score est appliqué directement via ngOnChanges
        fixture.componentRef.setInput('animated', false);
        fixture.componentRef.setInput('score', 4.2);
        fixture.detectChanges();

        expect(component.displayScore).toBeCloseTo(4.2, 1);
        expect(component.displayScoreStr).toBe('4.2');
    });

    it('should emit rendered when animated is false', () => {
        // Mode non-animé : rendered est émis synchonement dans ngOnChanges
        const emitSpy = vi.spyOn(component.rendered, 'emit');

        fixture.componentRef.setInput('animated', false);
        fixture.componentRef.setInput('score', 3.0);
        fixture.detectChanges();

        expect(emitSpy).toHaveBeenCalledOnce();
    });

    it('should cancel animation on destroy to prevent memory leak', () => {
        vi.useFakeTimers();
        const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame');

        fixture.componentRef.setInput('animated', true);
        fixture.componentRef.setInput('score', 3.5);
        fixture.detectChanges();

        // L'animation a démarré, animationId est non-null
        // On détruit le composant — ngOnDestroy doit annuler le rAF
        fixture.destroy();

        expect(cancelSpy).toHaveBeenCalled();
    });

    it('should generate correct SVG arc path for score 2.5/5', () => {
        // Test pur de la méthode géométrique — pas d'animation impliquée
        component.displayScore = 2.5;
        component.maxScore = 5;
        // Appel direct de getProgressPath (méthode publique)
        const path = component.getProgressPath();

        expect(path).toBeTruthy();
        expect(path).toContain('M');
        expect(path).toContain('A');
    });

    it('should clamp score to maxScore if score exceeds it', () => {
        fixture.componentRef.setInput('animated', false);
        fixture.componentRef.setInput('score', 10); // > maxScore de 5
        fixture.detectChanges();

        // displayScore ne doit pas dépasser maxScore
        expect(component.displayScore).toBeLessThanOrEqual(component.maxScore);
    });

    it('should use IA arc color class when rail is IA', () => {
        fixture.componentRef.setInput('rail', 'IA');
        fixture.componentRef.setInput('score', 2);
        fixture.detectChanges();

        expect(component.arcColorClass).toBe('gauge-ia');
    });

    it('should use correct arc color class for MCC CRITICAL', () => {
        fixture.componentRef.setInput('rail', 'MCC');
        fixture.componentRef.setInput('riskClass', 'CRITICAL');
        fixture.componentRef.setInput('score', 1);
        fixture.detectChanges();

        expect(component.arcColorClass).toBe('gauge-error');
    });
});
