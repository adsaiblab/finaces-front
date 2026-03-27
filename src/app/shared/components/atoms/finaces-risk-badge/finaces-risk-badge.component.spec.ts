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
        fixture.componentRef.setInput('riskClass', 'LOW');
        TestBed.flushEffects();
        fixture.detectChanges(); // second pass to stabilize OnPush @Input bindings
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display LOW risk label for MCC rail', () => {
        fixture.componentRef.setInput('riskClass', 'LOW');
        fixture.componentRef.setInput('rail', 'MCC');
        TestBed.flushEffects();
        fixture.detectChanges();

        expect(component.metadata().label).toBe('Low');
        expect(component.isMcc()).toBe(true);
    });

    it('should display CRITICAL risk label for IA rail', () => {
        fixture.componentRef.setInput('riskClass', 'CRITICAL');
        fixture.componentRef.setInput('rail', 'IA');
        TestBed.flushEffects();
        fixture.detectChanges();

        expect(component.metadata().label).toBe('Critical');
        expect(component.isMcc()).toBe(false);
    });

    it('should include badge-sm class when size is sm', () => {
        fixture.componentRef.setInput('size', 'sm');
        TestBed.flushEffects();
        fixture.detectChanges();

        expect(component.badgeClasses()).toContain('badge-sm');
    });

    it('should include correct semantic CSS class for MCC LOW', () => {
        fixture.componentRef.setInput('riskClass', 'LOW');
        fixture.componentRef.setInput('rail', 'MCC');
        TestBed.flushEffects();
        fixture.detectChanges();

        expect(component.badgeClasses()).toContain('badge-mcc-low');
    });

    it('should include correct semantic CSS class for IA CRITICAL', () => {
        fixture.componentRef.setInput('riskClass', 'CRITICAL');
        fixture.componentRef.setInput('rail', 'IA');
        TestBed.flushEffects();
        fixture.detectChanges();

        expect(component.badgeClasses()).toContain('badge-ia-critical');
    });

    it('should hide label element when showLabel is false', () => {
        fixture.componentRef.setInput('showLabel', false);
        TestBed.flushEffects();
        fixture.detectChanges();

        const label = fixture.nativeElement.querySelector('.badge-label');
        expect(label).toBeFalsy();
    });
});
