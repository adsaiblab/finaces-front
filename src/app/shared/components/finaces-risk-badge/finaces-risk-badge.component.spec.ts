import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesRiskBadgeComponent } from './finaces-risk-badge.component';

describe('FinacesRiskBadgeComponent', () => {
    let component: FinacesRiskBadgeComponent;
    let fixture: ComponentFixture<FinacesRiskBadgeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FinacesRiskBadgeComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(FinacesRiskBadgeComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display LOW risk with MCC colors', () => {
        component.riskClass = 'LOW';
        component.rail = 'MCC';
        component.ngOnChanges({
            riskClass: {} as any,
            rail: {} as any
        });
        expect(component.colorScheme?.label).toBe('Faible');
        expect(component.isMcc).toBe(true);
    });

    it('should display CRITICAL risk with IA colors', () => {
        component.riskClass = 'CRITICAL';
        component.rail = 'IA';
        component.ngOnChanges({
            riskClass: {} as any,
            rail: {} as any
        });
        expect(component.colorScheme?.label).toBe('Critique');
        expect(component.isMcc).toBe(false);
    });

    it('should render size sm with correct classes', () => {
        component.size = 'sm';
        fixture.detectChanges();
        const badge = fixture.nativeElement.querySelector('.badge-sm');
        expect(badge).toBeTruthy();
    });

    it('should hide label when showLabel is false', () => {
        component.showLabel = false;
        fixture.detectChanges();
        const label = fixture.nativeElement.querySelector('.badge-label');
        expect(label).toBeFalsy();
    });
});