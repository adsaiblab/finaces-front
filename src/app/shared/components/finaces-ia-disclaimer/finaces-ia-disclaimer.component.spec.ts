import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesIaDisclaimerComponent } from './finaces-ia-disclaimer.component';
import { By } from '@angular/platform-browser';

describe('FinacesIaDisclaimerComponent', () => {
    let component: FinacesIaDisclaimerComponent;
    let fixture: ComponentFixture<FinacesIaDisclaimerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FinacesIaDisclaimerComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(FinacesIaDisclaimerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display default info message and correct icon', () => {
        expect(component.message).toContain('Assistant IA');
        expect(component.disclaimerClass).toBe('disclaimer-info');
        expect(component.iconName).toBe('auto_awesome');
    });

    it('should apply warning class and icon when type is warning', () => {
        component.type = 'warning';
        fixture.detectChanges();

        expect(component.disclaimerClass).toBe('disclaimer-warning');
        expect(component.iconName).toBe('warning_amber');
    });

    it('should display the custom message provided via input', () => {
        const customMsg = 'Attention : les ratios IA doivent être vérifiés manuellement.';
        component.message = customMsg;
        fixture.detectChanges();

        const textElement = fixture.debugElement.query(By.css('.disclaimer-text')).nativeElement;
        expect(textElement.textContent.trim()).toBe(customMsg);
    });
});