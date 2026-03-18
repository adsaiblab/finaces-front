import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesIaDisclaimerComponent } from './finaces-ia-disclaimer.component';
import { vi } from 'vitest';

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

    it('should display banner variant by default', () => {
        const el = fixture.nativeElement.querySelector('.ia-banner');
        expect(el).toBeTruthy();
    });

    it('should show pilot mode text when enabled in banner mode', () => {
        fixture.componentRef.setInput('pilotMode', true);
        fixture.detectChanges();
        const pilotText = fixture.nativeElement.querySelector('.disclaimer-pilot');
        expect(pilotText).toBeTruthy();
    });

    it('should emit dismissed event and hide when dismiss button is clicked', () => {
        const emitSpy = vi.spyOn(component.dismissed, 'emit');
        fixture.componentRef.setInput('dismissible', true);
        fixture.detectChanges();

        const button = fixture.nativeElement.querySelector('.dismiss-button');
        button.click();
        fixture.detectChanges();

        expect(emitSpy).toHaveBeenCalled();
        const disclaimer = fixture.nativeElement.querySelector('.ia-disclaimer');
        expect(disclaimer).toBeFalsy();
    });
});
