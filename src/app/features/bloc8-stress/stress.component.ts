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

import { StressService } from '../../core/services/stress.service';
import { StressTestResponse, StressParameters, Milestone, StressScenarioInputSchema, StressScenarioResult } from '../../core/models/stress.model';
import {
  FinacesSkeletonLoaderComponent,
  FinacesInlineErrorComponent,
  ErrorCode,
} from '../../shared/components';

import {
  StressParametersComponent,
  MilestoneTimelineComponent,
  ScenarioResultsComponent,
} from './components';

/** Onglets du toggle CONTRACT / MACRO / SHOCK */
export type StressTab = 'CONTRACT' | 'MACRO' | 'SHOCK';

@Component({
  selector: 'app-bloc8-stress',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    FinacesSkeletonLoaderComponent,
    FinacesInlineErrorComponent,
    StressParametersComponent,
    MilestoneTimelineComponent,
    ScenarioResultsComponent,
  ],
  templateUrl: './stress.component.html',
  styleUrls: ['./stress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StressComponent implements OnInit {
  private readonly caseContext   = inject(CaseContextService);
  private readonly router        = inject(Router);
  private readonly stressService = inject(StressService);
  private readonly snackBar      = inject(MatSnackBar);
  private readonly destroyRef    = inject(DestroyRef);

  readonly caseId = signal<string>('');

  readonly stressData   = signal<StressTestResponse | null>(null);
  readonly isLoading    = signal<boolean>(false);
  readonly isSimulating = signal<boolean>(false);

  readonly loadError       = signal<ErrorCode | null>(null);
  readonly simulationError = signal<ErrorCode | null>(null);
  readonly retryCount      = signal<number>(0);

  readonly activeTab = signal<StressTab>('CONTRACT');

  readonly hasNoData = computed(
    () => !this.isLoading() && !this.loadError() && !this.stressData()
  );

  readonly currentParams     = signal<Partial<StressParameters>>({});
  readonly currentMilestones = signal<Milestone[]>([]);

  ngOnInit(): void {
    this.caseId.set(this.caseContext.caseId());
    this.loadInitialStressData();
  }

  setTab(tab: StressTab): void {
    this.activeTab.set(tab);
  }

  onRetryLoad(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.retryCount.update((n) => n + 1);
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
            contract_value:      1_200_000,
            initial_cash:         250_000,
            available_credit:     100_000,
            operating_cash_flow:   45_000,
            milestones: [],
          },
          scenarios: [
            {
              scenario_name: 'Référence (30 jours)',
              description: 'Conditions de paiement standard exécutées comme prévu.',
              min_cash_balance: 120_000,
              months_in_negative: 0,
              status: 'RESILIENT',
              cash_curve: [250000,200000,150000,280000,260000,240000,350000,310000,290000,410000,380000,450000],
            },
            {
              scenario_name: 'Retard 60 jours',
              description: 'Tous les paiements jalons décalés de 30 jours supplémentaires.',
              min_cash_balance: 10_000,
              months_in_negative: 0,
              status: 'MARGINAL',
              cash_curve: [250000,200000,150000,100000,50000,10000,140000,90000,40000,160000,110000,230000],
            },
            {
              scenario_name: 'Retard 90 jours',
              description: 'Scénario de stress critique. Paiements décalés de 60 jours au total.',
              min_cash_balance: -80_000,
              months_in_negative: 2,
              status: 'BREACH',
              cash_curve: [250000,200000,150000,100000,50000,0,-50000,-80000,40000,-10000,110000,60000],
            },
          ],
        });
        this.isLoading.set(false);
      });
  }

  updateParams(params: Partial<StressParameters>): void {
    this.currentParams.set(params);
  }

  updateMilestones(milestones: Milestone[]): void {
    this.currentMilestones.set(milestones);
  }

  runSimulation(): void {
    const payload: StressParameters = {
      ...(this.currentParams() as StressParameters),
      milestones: this.currentMilestones(),
    };

    this.isSimulating.set(true);
    this.simulationError.set(null);

    this.stressService
      .runCustomStressTest(this.caseId(), payload as unknown as StressScenarioInputSchema)
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
              const current = this.stressData();
              if (current) {
                this.stressData.set({
                  ...current,
                  scenarios: current.scenarios.map((s: StressScenarioResult) => ({
                    ...s,
                    min_cash_balance: s.min_cash_balance + 20_000,
                    cash_curve: s.cash_curve.map((c: number) => c + 20_000),
                  })),
                });
              }
              this.simulationError.set('server');
              this.isSimulating.set(false);
              this.snackBar.open('Simulation terminée (mode démo).', 'OK', { duration: 3000 });
            });
        },
      });
  }

  navigateBack(): void {
    this.router.navigate(['/cases', this.caseId(), 'tension']);
  }

  proceedToExpert(): void {
    this.router.navigate(['/cases', this.caseId(), 'expert']);
  }
}
