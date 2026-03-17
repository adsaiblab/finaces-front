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

    it('should apply success class for score >= 80', () => {
        component.score = 85;
        component.ngOnChanges({ score: {} as any });
        expect(component.colorClass).toBe('gauge-success');
    });

    it('should apply error class for score < 50', () => {
        component.score = 45;
        component.ngOnChanges({ score: {} as any });
        expect(component.colorClass).toBe('gauge-error');
    });

    it('should apply ia variant class when iaVariant is true', () => {
        component.score = 90;
        component.iaVariant = true;
        component.ngOnChanges({ score: {} as any });
        expect(component.colorClass).toBe('gauge-ia');
    });

    it('should clamp score between 0 and 100', () => {
        component.score = 150;
        component.ngOnChanges({ score: {} as any });
        expect(component.dashoffset).toBe(0); // Full circle
    });
});