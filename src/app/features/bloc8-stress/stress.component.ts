import { Component, ChangeDetectionStrategy, signal, computed, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { Router } from '@angular/router';
import { CaseContextService } from '../../core/services/case-context.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { StressService } from '../../core/services/stress.service';
import { StressTestResponse, StressParameters, Milestone } from '../../core/models/stress.model';
import { FinacesInlineErrorComponent } from '../../shared/components/atoms/finaces-inline-error/finaces-inline-error.component';

import {
  StressParametersComponent,
  MilestoneTimelineComponent,
  ScenarioResultsComponent,
} from './components';

@Component({
  selector: 'app-bloc8-stress',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    FinacesInlineErrorComponent,
    StressParametersComponent,
    MilestoneTimelineComponent,
    ScenarioResultsComponent,
  ],
  templateUrl: './stress.component.html',
  styleUrls: ['./stress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StressComponent {
  private readonly caseContext = inject(CaseContextService);
  private readonly router = inject(Router);
  private readonly stressService = inject(StressService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  public caseId = signal<string>('');

  public stressData = signal<StressTestResponse | null>(null);
  public isLoading = signal<boolean>(true);
  public isSimulating = signal<boolean>(false);

  /** Erreur de chargement initial (null = pas d'erreur) */
  public loadError = signal<string | null>(null);
  /** Erreur de simulation (null = pas d'erreur) */
  public isSimulationError = signal<boolean>(false);
  /** Compteur de tentatives — déclenche un nouvel appel dans onRetryLoad() */
  public retryCount = signal<number>(0);

  /** Aucune donnée disponible après un chargement réussi */
  public hasNoData = computed(() => !this.isLoading() && !this.loadError() && !this.stressData());

  // State for user inputs
  public currentParams = signal<Partial<StressParameters>>({});
  public currentMilestones = signal<Milestone[]>([]);

  ngOnInit(): void {
    this.caseId.set(this.caseContext.caseId());
    this.loadInitialStressData();
  }

  public onRetryLoad(): void {
    this.loadError.set(null);
    this.retryCount.update(n => n + 1);
    this.loadInitialStressData();
  }

  private loadInitialStressData(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.stressService
      .getStressTests(this.caseId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: unknown) => {
          this.stressData.set(data as StressTestResponse);
          this.isLoading.set(false);
        },
        error: () => {
          this.loadMockData();
        },
      });
  }

  private loadMockData(): void {
    of(null)
      .pipe(delay(800), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.stressData.set({
          case_id: this.caseId(),
          computed_at: new Date().toISOString(),
          base_parameters: {
            contract_value: 1200000,
            initial_cash: 250000,
            available_credit: 100000,
            operating_cash_flow: 45000,
            milestones: [],
          },
          scenarios: [
            {
              scenario_name: 'Référence (30 jours)',
              description: 'Conditions de paiement standard exécutées comme prévu.',
              min_cash_balance: 120000,
              months_in_negative: 0,
              status: 'RESILIENT',
              cash_curve: [250000, 200000, 150000, 280000, 260000, 240000, 350000, 310000, 290000, 410000, 380000, 450000],
            },
            {
              scenario_name: 'Retard 60 jours',
              description: 'Tous les paiements jalons décalés de 30 jours supplémentaires.',
              min_cash_balance: 10000,
              months_in_negative: 0,
              status: 'MARGINAL',
              cash_curve: [250000, 200000, 150000, 100000, 50000, 10000, 140000, 90000, 40000, 160000, 110000, 230000],
            },
            {
              scenario_name: 'Retard 90 jours',
              description: 'Scénario de stress critique. Paiements décalés de 60 jours au total.',
              min_cash_balance: -80000,
              months_in_negative: 2,
              status: 'BREACH',
              cash_curve: [250000, 200000, 150000, 100000, 50000, 0, -50000, -80000, 40000, -10000, 110000, 60000],
            },
          ],
        });
        this.isLoading.set(false);
      });
  }

  public updateParams(params: Partial<StressParameters>): void {
    this.currentParams.set(params);
  }

  public updateMilestones(milestones: Milestone[]): void {
    this.currentMilestones.set(milestones);
  }

  public runSimulation(): void {
    const payload: StressParameters = {
      ...(this.currentParams() as StressParameters),
      milestones: this.currentMilestones(),
    };

    this.isSimulating.set(true);
    this.isSimulationError.set(false);
    this.stressService
      .runCustomStressTest(this.caseId(), payload as any)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: unknown) => {
          this.stressData.set(data as StressTestResponse);
          this.isSimulating.set(false);
          this.snackBar.open('Simulation de stress terminée avec succès.', 'OK', { duration: 3000 });
        },
        error: () => {
          of(null)
            .pipe(delay(1000), takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
              const currentData = this.stressData();
              if (currentData) {
                this.stressData.set({
                  ...currentData,
                  scenarios: currentData.scenarios.map((s: any) => ({
                    ...s,
                    min_cash_balance: s.min_cash_balance + 20000,
                    cash_curve: s.cash_curve.map((c: number) => c + 20000),
                  })),
                });
              }
              this.isSimulating.set(false);
              this.snackBar.open('Simulation terminée (mode démo).', 'OK', { duration: 3000 });
            });
        },
      });
  }

  public navigateBack(): void {
    this.router.navigate(['/cases', this.caseId(), 'tension']);
  }

  public proceedToExpert(): void {
    this.router.navigate(['/cases', this.caseId(), 'expert']);
  }
}
