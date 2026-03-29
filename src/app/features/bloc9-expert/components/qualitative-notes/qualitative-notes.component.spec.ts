import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QualitativeNotesComponent } from './qualitative-notes.component';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('QualitativeNotesComponent', () => {
  let component: QualitativeNotesComponent;
  let fixture: ComponentFixture<QualitativeNotesComponent>;
  let fb: FormBuilder;
  let formGroup: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QualitativeNotesComponent, ReactiveFormsModule, NoopAnimationsModule],
    }).compileComponents();

    fb = TestBed.inject(FormBuilder);
    formGroup = fb.group({
      liquidity_comment: [''],
      solvability_comment: [''],
      profitability_comment: [''],
      capacity_comment: [''],
      quality_comment: [''],
      dynamic_analysis_comment: [''],
      mitigating_factors: [''],
      risk_factors: [''],
    });

    fixture = TestBed.createComponent(QualitativeNotesComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('parentGroup', formGroup);
    fixture.componentRef.setInput('controlName', 'qualitativeNotes');
    fixture.componentRef.setInput('tensionLabel', 'NONE');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
