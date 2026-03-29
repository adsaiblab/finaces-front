import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidationDecisionComponent } from './validation-decision.component';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ValidationDecisionComponent', () => {
  let component: ValidationDecisionComponent;
  let fixture: ComponentFixture<ValidationDecisionComponent>;
  let fb: FormBuilder;
  let formGroup: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValidationDecisionComponent, ReactiveFormsModule, NoopAnimationsModule],
    }).compileComponents();

    fb = TestBed.inject(FormBuilder);
    formGroup = fb.group({
      finalDecision: [''],
      rejectionReason: [''],
    });

    fixture = TestBed.createComponent(ValidationDecisionComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('parentGroup', formGroup);
    fixture.componentRef.setInput('decisionControlName', 'finalDecision');
    fixture.componentRef.setInput('reasonControlName', 'rejectionReason');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
