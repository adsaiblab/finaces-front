import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RiskOverrideComponent } from './risk-override.component';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('RiskOverrideComponent', () => {
    let component: RiskOverrideComponent;
    let fixture: ComponentFixture<RiskOverrideComponent>;
    let fb: FormBuilder;
    let formGroup: FormGroup;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RiskOverrideComponent, ReactiveFormsModule, NoopAnimationsModule]
        }).compileComponents();

        fb = TestBed.inject(FormBuilder);
        formGroup = fb.group({ manualRiskOverride: ['AUCUN'] });

        fixture = TestBed.createComponent(RiskOverrideComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('parentGroup', formGroup);
        fixture.componentRef.setInput('controlName', 'manualRiskOverride');
        fixture.componentRef.setInput('currentRiskClass', 'MODÉRÉ');
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});