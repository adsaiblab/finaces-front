import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesScoreGaugeComponent } from './finaces-score-gauge.component';

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

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should apply gauge-success class for score >= 80', () => {
        component.score = 85;
        component.ngOnChanges({ score: {} as any });
        expect(component.colorClass).toBe('gauge-success');
    });

    it('should apply gauge-warning class for score >= 50 and < 80', () => {
        component.score = 65;
        component.ngOnChanges({ score: {} as any });
        expect(component.colorClass).toBe('gauge-warning');
    });

    it('should apply gauge-error class for score < 50', () => {
        component.score = 45;
        component.ngOnChanges({ score: {} as any });
        expect(component.colorClass).toBe('gauge-error');
    });

    it('should apply gauge-ia class when iaVariant is true, regardless of score', () => {
        component.score = 90;
        component.iaVariant = true;
        component.ngOnChanges({ iaVariant: {} as any });
        expect(component.colorClass).toBe('gauge-ia');
    });

    it('should mathematically clamp score between 0 and 100 for dashoffset calculation', () => {
        component.score = 150;
        component.ngOnChanges({ score: {} as any });
        expect(component.dashoffset).toBe(0); // Offset 0 = Cercle rempli à 100%
    });
});