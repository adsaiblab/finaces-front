import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { CaseService } from '../../core/services/case.service';
import { ExpertService } from '../../core/services/expert.service';
import { EvaluationCaseDetailOut } from '../../core/models/case.model';
import { ExpertReviewInputSchema, ConclusionUpdate, MccCondition } from '../../core/models/expert.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DecisionRecapComponent } from './components/decision-recap/decision-recap.component';
import { QualitativeNotesComponent } from './components/qualitative-notes/qualitative-notes.component';
import { RiskOverrideComponent } from './components/risk-override/risk-override.component';
import { ValidationDecisionComponent } from './components/validation-decision/validation-decision.component';
import { MccConditionsComponent } from './components/mcc-conditions/mcc-conditions.component';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-expert-review',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DecisionRecapComponent,
    QualitativeNotesComponent,
    RiskOverrideComponent,
    ValidationDecisionComponent,
    MccConditionsComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './expert.component.html',
  styleUrls: ['./expert.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExpertComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private caseService = inject(CaseService);
  private expertService = inject(ExpertService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  caseId = this.route.parent?.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('id') || '';

  currentCase = signal<EvaluationCaseDetailOut | null>(null);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);
  isSubmitted = signal<boolean>(false);

  conditions = signal<MccCondition[]>([]);

  // Le FormGroup reflète EXACTEMENT les 2 schémas API combinés
  reviewForm = this.fb.group({
    // --- PART 1 : ExpertReviewInputSchema ---
    liquidity_comment: ['', Validators.required],
    solvability_comment: ['', Validators.required],
    profitability_comment: ['', Validators.required],
    capacity_comment: ['', Validators.required],
    quality_comment: ['', Validators.required],
    dynamic_analysis_comment: ['', Validators.required],
    mitigating_factors: [''],
    risk_factors: [''],
    override_recommendation: ['NONE'], // Map to Risk Override

    // --- PART 2 : ConclusionUpdate ---
    conclusion_text: ['', Validators.required],
    final_recommendation: ['', Validators.required], // Map to Validation Decision
    rejection_reason: [''] // Temporary field for UI routing, merged into conclusion_text if needed
  });

  ngOnInit(): void {
    if (!this.caseId) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loadCaseData();
  }

  private loadCaseData(): void {
    this.isLoading.set(true);
    this.caseService.getCaseDetail(this.caseId).subscribe({
      next: (data: EvaluationCaseDetailOut) => {
        this.currentCase.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Error loading case data', 'Close', { duration: 3000 });
      }
    });
  }

  submitReview(): void {
    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    const formVal = this.reviewForm.value;

    // 1. Construit le Payload strict pour la Revue
    const reviewPayload: ExpertReviewInputSchema = {
      liquidity_comment: formVal.liquidity_comment || '',
      solvability_comment: formVal.solvability_comment || '',
      profitability_comment: formVal.profitability_comment || '',
      capacity_comment: formVal.capacity_comment || '',
      quality_comment: formVal.quality_comment || '',
      dynamic_analysis_comment: formVal.dynamic_analysis_comment || '',
      mitigating_factors: formVal.mitigating_factors || undefined,
      risk_factors: formVal.risk_factors || undefined,
      override_recommendation: formVal.override_recommendation === 'NONE' ? undefined : formVal.override_recommendation || undefined
    };

    // 2. Construit le Payload strict pour la Conclusion
    const conclusionPayload: ConclusionUpdate = {
      conclusion_text: formVal.conclusion_text || '',
      final_recommendation: formVal.final_recommendation || '',
      conditional_factors: this.conditions().map(c => `[${c.type}] ${c.description}`)
    };

    this.isSubmitting.set(true);

    this.expertService.submitExpertReview(this.caseId, reviewPayload).pipe(
      catchError(() => {
        // 🔧 Mock fallback — backend indisponible ou dossier fictif
        return of({ id: 'mock-review-id', case_id: this.caseId } as any);
      })
    ).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isSubmitted.set(true);
        this.reviewForm.disable();
        this.snackBar.open('Review mock-submitted successfully', 'Close', { duration: 3000 });
        // Appel de this.expertService.submitConclusion(this.caseId, conclusionPayload) ici dans le futur
      },
      error: () => {
        this.isSubmitting.set(false);
        this.snackBar.open('Submission failed', 'Close', { duration: 3000 });
      }
    });
  }

  resetForm(): void {
    this.reviewForm.enable();
    this.isSubmitted.set(false);
  }

  closeCase(): void {
    this.router.navigate(['/cases', this.caseId, 'rapport']);
  }

  goBack(): void {
    this.router.navigate(['/cases', this.caseId, 'stress']);
  }
}