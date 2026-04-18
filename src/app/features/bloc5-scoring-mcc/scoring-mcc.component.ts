import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  DestroyRef,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { Router } from '@angular/router';
import { CaseContextService } from '../../core/services/case-context.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { FinacesScoreGaugeComponent } from '../../shared/components/atoms/finaces-score-gauge/finaces-score-gauge.component';
import { FinacesRiskBadgeComponent } from '../../shared/components/atoms/finaces-risk-badge/finaces-risk-badge.component';
import {
  FinacesInlineErrorComponent,
  FinacesSkeletonLoaderComponent,
  ErrorCode,
  FinacesEmptyStateComponent,
} from '../../shared/components';
import { ScoringMccService } from './services/scoring-mcc.service';
import { ScorecardOutputSchema, ScoreOverridePayload } from '../../core/models/scoring.model';

import {
  PillarDetailCardComponent,
  OverrideZoneComponent,
  RecommendationsSectionComponent,
} from './components';

@Component({
  selector: 'app-scoring-mcc',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    PillarDetailCardComponent,
    OverrideZoneComponent,
    RecommendationsSectionComponent,
    FinacesScoreGaugeComponent,
    FinacesRiskBadgeComponent,
    FinacesInlineErrorComponent,
    FinacesSkeletonLoaderComponent,
    FinacesEmptyStateComponent,
  ],
  templateUrl: './scoring-mcc.component.html',
  styleUrls: ['./scoring-mcc.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScoringMccComponent implements OnInit {
  private readonly caseContext    = inject(CaseContextService);
  private readonly router         = inject(Router);
  private readonly scoringService = inject(ScoringMccService);
  private readonly snackBar       = inject(MatSnackBar);
  private readonly destroyRef     = inject(DestroyRef);

  // ─── State signals ──────────────────────────────────────────────────
  readonly caseId      = signal<string>('');
  readonly scoringData = signal<ScorecardOutputSchema | null>(null);
  readonly isLoading   = signal<boolean>(true);
  readonly isComputing = signal<boolean>(false);
  readonly isOverriding = signal<boolean>(false);

  // ─── Error signals ───────────────────────────────────────────────────
  readonly loadError  = signal<ErrorCode | null>(null);
  readonly retryCount = signal<number>(0);

  // ─── Computed signals ─────────────────────────────────────────────────
  readonly hasNoData = computed(
    () => !this.isLoading() && !this.loadError() && !this.scoringData(),
  );

  readonly liquidityPillar = computed(
    () => this.scoringData()?.pillars?.find((p) => p.name.toLowerCase().includes('liquid')) ?? null,
  );
  readonly solvencyPillar = computed(
    () => this.scoringData()?.pillars?.find((p) => p.name.toLowerCase().includes('solven')) ?? null,
  );
  readonly profitabilityPillar = computed(
    () => this.scoringData()?.pillars?.find((p) => p.name.toLowerCase().includes('profit')) ?? null,
  );
  readonly capacityPillar = computed(
    () => this.scoringData()?.pillars?.find((p) => p.name.toLowerCase().includes('capaci')) ?? null,
  );
  readonly qualityPillar = computed(
    () => this.scoringData()?.pillars?.find((p) => p.name.toLowerCase().includes('quality')) ?? null,
  );

  ngOnInit(): void {
    this.caseId.set(this.caseContext.caseId());
    this.loadScoring();
  }

  /**
   * Initial Load: Attempts to retrieve existing data (GET).
   * Does NOT trigger a calculation by default.
   */
  private loadScoring(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.scoringData.set(null);

    this.scoringService
      .getExistingScoring(this.caseId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.scoringData.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          const status = err?.status;
          if (status === 404) {
            // No data yet: this is a normal state, not a "load error"
            this.scoringData.set(null);
            this.isLoading.set(false);
            return;
          }
          if (status === 401 || status === 403) {
            this.isLoading.set(false);
            this.router.navigate(['/auth/login']);
            return;
          }
          this.loadError.set('server');
          this.scoringData.set(null);
          this.isLoading.set(false);
        },
      });
  }

  /**
   * Manual Trigger: Launches the scoring engine (POST).
   */
  public recomputeScoring(): void {
    if (this.isComputing()) return;

    this.isComputing.set(true);
    this.scoringService
      .computeScoring(this.caseId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.scoringData.set(data);
          this.isComputing.set(false);
          this.snackBar.open('Score calculé avec succès.', 'OK', { duration: 3000 });
        },
        error: (err) => {
          this.isComputing.set(false);
          if (err?.status === 400) {
            this.snackBar.open('Score déjà calculé, rechargez la page pour voir les données.', 'Fermer', { duration: 5000 });
          } else {
            this.snackBar.open('Erreur lors du calcul du score.', 'OK', { duration: 4000 });
          }
        },
      });
  }

  // ─── Retry ───────────────────────────────────────────────────────────
  onRetryLoad(): void {
    this.retryCount.update(n => n + 1);
    this.loadError.set(null);
    this.loadScoring();
  }

  // ─── Override ───────────────────────────────────────────────────────────
  public handleOverride(payload: ScoreOverridePayload): void {
    this.isOverriding.set(true);
    this.scoringService
      .overrideScore(this.caseId(), payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedData) => {
          this.scoringData.set(updatedData);
          this.isOverriding.set(false);
          this.snackBar.open('Surclassement appliqué avec succès.', 'OK', {
            duration: 3000,
            panelClass: 'snack-success',
          });
        },
        error: () => {
          this.isOverriding.set(false);
          this.snackBar.open('Erreur lors de l\'application du surclassement.', 'OK', { duration: 3000 });
        },
      });
  }

  public navigateBack(): void {
    this.router.navigate(['/cases', this.caseId(), 'ratios']);
  }

  public proceedNext(): void {
    this.router.navigate(['/cases', this.caseId(), 'ia']);
  }
}
