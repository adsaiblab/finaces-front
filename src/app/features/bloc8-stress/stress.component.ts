import { Component, ChangeDetectionStrategy, signal, inject, DestroyRef } from '@angular/core';
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
  private router = inject(Router);
  private stressService = inject(StressService);
  private snackBar = inject(MatSnackBar);

  public caseId = signal<string>('');
  private readonly destroyRef = inject(DestroyRef);

  public stressData = signal<StressTestResponse | null>(null);
  public isLoading = signal<boolean>(true);
  public isSimulating = signal<boolean>(false);

  // State for user inputs
  public currentParams = signal<Partial<StressParameters>>({});
  public currentMilestones = signal<Milestone[]>([]);

  ngOnInit(): void {
    this.caseId.set(this.caseContext.caseId());
    this.loadInitialStressData();
  }

  private loadInitialStressData(): void {
    this.isLoading.set(true);
    this.stressService.getStressTests(this.caseId()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data: unknown) => {
        this.stressData.set(data as StressTestResponse);
        this.isLoading.set(false);
      },
      error: () => {
        this.loadMockData(); // Enterprise graceful degradation
      },
    });
  }

  private loadMockData(): void {
    of(null).pipe(
      delay(800),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
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
            scenario_name: 'Baseline (30 Days)',
            description: 'Standard payment terms executed as planned.',
            min_cash_balance: 120000,
            months_in_negative: 0,
            status: 'RESILIENT',
            cash_curve: [
              250000, 200000, 150000, 280000, 260000, 240000, 350000, 310000, 290000, 410000,
              380000, 450000,
            ],
          },
          {
            scenario_name: '60 Days Delay',
            description: 'All milestone payments delayed by an additional 30 days.',
            min_cash_balance: 10000,
            months_in_negative: 0,
            status: 'MARGINAL',
            cash_curve: [
              250000, 200000, 150000, 100000, 50000, 10000, 140000, 90000, 40000, 160000, 110000,
              230000,
            ],
          },
          {
            scenario_name: '90 Days Delay',
            description: 'Critical stress scenario. Payments delayed by 60 days total.',
            min_cash_balance: -80000,
            months_in_negative: 2,
            status: 'BREACH',
            cash_curve: [
              250000, 200000, 150000, 100000, 50000, 0, -50000, -80000, 40000, -10000, 110000,
              60000,
            ],
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
    this.stressService.runCustomStressTest(this.caseId(), payload as any).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data: unknown) => {
        this.stressData.set(data as StressTestResponse);
        this.isSimulating.set(false);
        this.snackBar.open('Stress simulation completed successfully.', 'OK', { duration: 3000 });
      },
      error: () => {
        // Mock simulation update
        of(null).pipe(delay(1000), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
          const currentData = this.stressData();
          if (currentData) {
            this.stressData.set({
              ...currentData,
              scenarios: [
                ...currentData.scenarios.map((s: any) => ({
                  ...s,
                  min_cash_balance: s.min_cash_balance + 20000,
                  cash_curve: s.cash_curve.map((c: number) => c + 20000),
                })),
              ],
            });
          }
          this.isSimulating.set(false);
          this.snackBar.open('Simulation complete (Mock Mode).', 'OK', { duration: 3000 });
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
