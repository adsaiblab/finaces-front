import { Component, ChangeDetectionStrategy, inject, signal, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';
import { CaseContextService } from '../../core/services/case-context.service';
import { CaseService } from '../../core/services/case.service';
import { ExpertService } from '../../core/services/expert.service';
import { EvaluationCaseDetailOut } from '../../core/models/case.model';
import {
  ExpertReviewInputSchema,
  ConclusionUpdate,
  MccCondition,
  OverrideRecommendation,
} from '../../core/models/expert.model';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DecisionRecapComponent } from './components/decision-recap/decision-recap.component';
import { QualitativeNotesComponent } from './components/qualitative-notes/qualitative-notes.component';
import { RiskOverrideComponent } from './components/risk-override/risk-override.component';
import { ValidationDecisionComponent } from './components/validation-decision/validation-decision.component';
import { MccConditionsComponent } from './components/mcc-conditions/mcc-conditions.component';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FinacesSkeletonLoaderComponent } from '../../shared/components/atoms/finaces-skeleton-loader/finaces-skeleton-loader.component';

@Component({
  selector: 'app-expert-review',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DecisionRecapComponent,
    QualitativeNotesComponent,
    RiskOverrideComponent,
    ValidationDecisionComponent,
    MccConditionsComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    FinacesSkeletonLoaderComponent,
  ],
  templateUrl: './expert.component.html',
  styleUrls: ['./expert.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpertComponent implements OnInit {
  private readonly caseContext   = inject(CaseContextService);
  private readonly router        = inject(Router);
  private readonly caseService   = inject(CaseService);
  private readonly expertService = inject(ExpertService);
  private readonly fb            = inject(FormBuilder);
  private readonly snackBar      = inject(MatSnackBar);
  private readonly destroyRef    = inject(DestroyRef);

  readonly caseId      = signal<string>('');
  readonly currentCase = signal<EvaluationCaseDetailOut | null>(null);
  readonly isLoading   = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);
  readonly isSubmitted  = signal<boolean>(false);
  readonly conditions   = signal<MccCondition[]>([]);

  readonly reviewForm = this.fb.group({
    // --- PART 1 : ExpertReviewInputSchema ---
    liquidity_comment:        ['', Validators.required],
    solvability_comment:      ['', Validators.required],
    profitability_comment:    ['', Validators.required],
    capacity_comment:         ['', Validators.required],
    quality_comment:          ['', Validators.required],
    dynamic_analysis_comment: ['', Validators.required],
    mitigating_factors:       [''],
    risk_factors:             [''],
    override_recommendation:  [OverrideRecommendation.NONE],
    // --- PART 2 : ConclusionUpdate ---
    conclusion_text:      ['', Validators.required],
    final_recommendation: ['', Validators.required],
    rejection_reason:     [''],
  });

  ngOnInit(): void {
    this.caseId.set(this.caseContext.caseId());
    if (!this.caseId()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loadCaseData();
  }

  private loadCaseData(): void {
    this.isLoading.set(true);
    this.caseService
      .getCaseDetail(this.caseId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: EvaluationCaseDetailOut) => {
          this.currentCase.set(data);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.snackBar.open('Error loading case data', 'Close', { duration: 3000 });
        },
      });
  }

  submitReview(): void {
    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    const formVal = this.reviewForm.value;

    const reviewPayload: ExpertReviewInputSchema = {
      liquidity_comment:        formVal.liquidity_comment || '',
      solvability_comment:      formVal.solvability_comment || '',
      profitability_comment:    formVal.profitability_comment || '',
      capacity_comment:         formVal.capacity_comment || '',
      quality_comment:          formVal.quality_comment || '',
      dynamic_analysis_comment: formVal.dynamic_analysis_comment || '',
      mitigating_factors: formVal.mitigating_factors
        ? Array.isArray(formVal.mitigating_factors)
          ? formVal.mitigating_factors
          : [formVal.mitigating_factors]
        : undefined,
      risk_factors: formVal.risk_factors
        ? Array.isArray(formVal.risk_factors)
          ? formVal.risk_factors
          : [formVal.risk_factors]
        : undefined,
      override_recommendation:
        formVal.override_recommendation === OverrideRecommendation.NONE
          ? undefined
          : formVal.override_recommendation || undefined,
    };

    const conclusionPayload: ConclusionUpdate = {
      conclusion_text:      formVal.conclusion_text || '',
      final_recommendation: formVal.final_recommendation || '',
      conditional_factors:  this.conditions().map((c) => `[${c.type}] ${c.description}`),
    };

    this.isSubmitting.set(true);

    const submission$ = environment.features.mockData
      ? of({ id: 'mock-review-id', case_id: this.caseId() } as unknown).pipe(delay(1500))
      : this.expertService.submitExpertReview(this.caseId(), reviewPayload);

    submission$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError((err) => {
          this.isSubmitting.set(false);
          this.snackBar.open('Submission failed : Backend Error', 'Close', {
            duration: 3000,
            panelClass: 'snack-error',
          });
          throw err;
        }),
      )
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.isSubmitted.set(true);
          this.reviewForm.disable();
          const msg = environment.features.mockData
            ? 'Review mock-submitted successfully'
            : 'Review submitted successfully';

          this.expertService
            .submitConclusion(this.caseId(), conclusionPayload)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => this.snackBar.open(msg, 'Close', { duration: 3000 }),
              error: () =>
                this.snackBar.open('Erreur lors de la conclusion', 'Close', { duration: 3000 }),
            });
        },
      });
  }

  resetForm(): void {
    this.reviewForm.enable();
    this.isSubmitted.set(false);
  }

  closeCase(): void {
    this.router.navigate(['/cases', this.caseId(), 'rapport']);
  }

  goBack(): void {
    this.router.navigate(['/cases', this.caseId(), 'stress']);
  }
}
