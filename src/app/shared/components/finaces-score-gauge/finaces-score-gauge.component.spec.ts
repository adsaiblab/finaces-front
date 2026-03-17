import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FinacesScoreGaugeComponent } from './finaces-score-gauge.component';
import { vi } from 'vitest';

describe('FinacesScoreGaugeComponent', () => {
    let component: FinacesScoreGaugeComponent;
    let fixture: ComponentFixture<FinacesScoreGaugeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FinacesScoreGaugeComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(FinacesScoreGaugeComponent);
        component = fixture.componentInstance;
    });

    it('should create with default size 120', () => {
        expect(component).toBeTruthy();
        expect(component.metrics.size).toBe(120);
    });

    it('should animate score from 0 to target', fakeAsync(() => {
        fixture.componentRef.setInput('score', 3.5);
        fixture.componentRef.setInput('animated', true);
        fixture.detectChanges();

        expect(component.displayScore).toBe(0);
        tick(400); // Milieu d'animation
        expect(component.displayScore).toBeGreaterThan(1.5);
        tick(400); // Fin
        expect(component.displayScore).toBeCloseTo(3.5, 1);
    }));

    it('should emit rendered when animation completes', fakeAsync(() => {
        const emitSpy = vi.spyOn(component.rendered, 'emit');
        fixture.componentRef.setInput('score', 3.0);
        fixture.componentRef.setInput('animated', true);
        fixture.detectChanges();

        tick(800);
        expect(emitSpy).toHaveBeenCalled();
    }));

    it('should generate correct progress path', () => {
        component.displayScore = 2.5;
        component.maxScore = 5;
        component.ngOnChanges({ riskClass: {} as any });

        const path = component.getProgressPath();
        expect(path).toBeTruthy();
        expect(path).toContain('M');
        expect(path).toContain('A');
    });
});