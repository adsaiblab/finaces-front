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

    it('should set displayScore immediately when animated is false', () => {
        fixture.componentRef.setInput('animated', false);
        fixture.componentRef.setInput('score', 4.2);
        fixture.detectChanges();

        expect(component.displayScore).toBeCloseTo(4.2, 1);
        expect(component.displayScoreStr).toBe('4.2');
    });

    it('should clamp score to maxScore when score exceeds it', () => {
        fixture.componentRef.setInput('animated', false);
        fixture.componentRef.setInput('score', 99);
        fixture.detectChanges();

        expect(component.displayScore).toBeLessThanOrEqual(component.maxScore);
    });

    it('should emit rendered synchronously when animated is false', () => {
        const emitSpy = vi.spyOn(component.rendered, 'emit');

        fixture.componentRef.setInput('animated', false);
        fixture.componentRef.setInput('score', 3.0);
        fixture.detectChanges();

        expect(emitSpy).toHaveBeenCalledOnce();
    });

    it('should cancel pending rAF on destroy to prevent memory leak', () => {
        // Vitest fake timers contrôlent requestAnimationFrame
        vi.useFakeTimers();
        const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame');

        fixture.componentRef.setInput('animated', true);
        fixture.componentRef.setInput('score', 3.5);
        fixture.detectChanges();

        fixture.destroy();

        expect(cancelSpy).toHaveBeenCalled();
    });

    it('should generate a valid SVG arc path for score 2.5/5', () => {
        component.displayScore = 2.5;
        component.maxScore = 5;
        const path = component.getProgressPath();

        expect(path).toBeTruthy();
        expect(path).toContain('M');
        expect(path).toContain('A');
    });

    it('should return empty arc path when displayScore is 0', () => {
        component.displayScore = 0;
        const path = component.getProgressPath();
        expect(path).toBe('');
    });

    it('should apply gauge-ia arc class when rail is IA', () => {
        fixture.componentRef.setInput('rail', 'IA');
        fixture.componentRef.setInput('score', 2);
        fixture.detectChanges();

        expect(component.arcColorClass).toBe('gauge-ia');
    });

    it('should apply gauge-error arc class for MCC CRITICAL', () => {
        fixture.componentRef.setInput('rail', 'MCC');
        fixture.componentRef.setInput('riskClass', 'CRITICAL');
        fixture.componentRef.setInput('score', 1);
        fixture.detectChanges();

        expect(component.arcColorClass).toBe('gauge-error');
    });

    it('should apply gauge-success arc class for MCC LOW', () => {
        fixture.componentRef.setInput('rail', 'MCC');
        fixture.componentRef.setInput('riskClass', 'LOW');
        fixture.componentRef.setInput('score', 4);
        fixture.detectChanges();

        expect(component.arcColorClass).toBe('gauge-success');
    });
});
