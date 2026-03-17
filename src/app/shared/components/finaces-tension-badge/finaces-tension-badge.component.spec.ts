import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinacesTensionBadgeComponent } from './finaces-tension-badge.component';

describe('FinacesTensionBadgeComponent', () => {
    let component: FinacesTensionBadgeComponent;
    let fixture: ComponentFixture<FinacesTensionBadgeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FinacesTensionBadgeComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(FinacesTensionBadgeComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should display correct label and class for SEVERE tension', () => {
        component.level = 'SEVERE';
        component.ngOnChanges({ level: {} as any });
        expect(component.config.label).toBe('Sévère');
        expect(component.config.colorClass).toBe('tension-severe');
    });
});