import { DatePipe, NgClass } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  DestroyRef,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CaseService } from '../../../core/services/case.service';
import { FinacesSkeletonLoaderComponent } from '../../../shared/components/molecules/finaces-skeleton-loader/finaces-skeleton-loader.component';
import { FinacesEmptyStateComponent } from '../../../shared/components/molecules/finaces-empty-state/finaces-empty-state.component';
import { FinacesInlineErrorComponent, ErrorCode } from '../../../shared/components/molecules/finaces-inline-error/finaces-inline-error.component';
import { EvaluationCaseOut } from '../../../core/models/case.model';

export type StepStatus = 'COMPLETED' | 'ACTIVE' | 'LOCKED';

export interface ProcessStep {
  id: 'gate' | 'financials' | 'scoring' | 'expert' | 'report';
  name: string;
  status: StepStatus;
  targetRoute: string;
}

export interface HubCase {
  id: string;
  bidder_name: string;
  updated_at: string;
  assignee: string;
  steps: ProcessStep[];
}

@Component({
  selector: 'app-cases-list',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatTooltipModule,
    FinacesSkeletonLoaderComponent,
    FinacesEmptyStateComponent,
    FinacesInlineErrorComponent,
    DatePipe,
    NgClass,
  ],
  templateUrl: './cases-list.component.html',
  styleUrls: ['./cases-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CasesListComponent implements OnInit {
  public router = inject(Router);
  private readonly caseService = inject(CaseService);
  private readonly destroyRef = inject(DestroyRef);

  cases = signal<HubCase[]>([]);
  isLoading = signal<boolean>(true);
  loadError = signal<ErrorCode | null>(null);
  retryCount = signal<number>(0);
  searchQuery = signal<string>('');
  filterMode = signal<'ALL' | 'PENDING_GATE' | 'REQUIRE_ATTENTION' | 'READY_REPORT'>('ALL');

  /** Liste vide après un chargement réussi (≠ erreur API) */
  hasNoCasesAtAll = computed(
    () => !this.isLoading() && this.loadError() === null && this.cases().length === 0,
  );

  filteredCases = computed(() => {
    let result = this.cases();

    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      result = result.filter(
        (c) => c.bidder_name.toLowerCase().includes(query) || c.id.toLowerCase().includes(query),
      );
    }

    const mode = this.filterMode();
    if (mode !== 'ALL') {
      result = result.filter((c) => {
        if (mode === 'PENDING_GATE') {
          return c.steps.find((s) => s.id === 'gate')?.status === 'ACTIVE';
        }
        if (mode === 'REQUIRE_ATTENTION') {
          const scoring = c.steps.find((s) => s.id === 'scoring');
          const expert = c.steps.find((s) => s.id === 'expert');
          return scoring?.status === 'ACTIVE' || expert?.status === 'ACTIVE';
        }
        if (mode === 'READY_REPORT') {
          return c.steps.find((s) => s.id === 'report')?.status === 'ACTIVE';
        }
        return true;
      });
    }

    return result;
  });

  ngOnInit(): void {
    this.loadCases();
  }

  private loadCases(): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    this.caseService
      .getCases()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (backendCases: EvaluationCaseOut[]) => {
          const hubCases: HubCase[] = backendCases.map((bc) => ({
            id: bc.id,
            bidder_name: bc.bidder_name || bc.market_reference || 'N/A',
            updated_at: bc.updated_at || bc.created_at || new Date().toISOString(),
            assignee: 'Analyste',
            steps: this.deriveSteps(bc.status),
          }));
          this.cases.set(hubCases);
          this.isLoading.set(false);
        },
        error: () => {
          this.cases.set([]);
          this.loadError.set('server');
          this.isLoading.set(false);
        },
      });
  }

  onRetryLoad(): void {
    const current = this.retryCount();
    this.retryCount.set(current + 1);
    this.loadCases();
  }

  private deriveSteps(status: string): ProcessStep[] {
    const buildSteps = (
      gate: StepStatus,
      fin: StepStatus,
      scor: StepStatus,
      exp: StepStatus,
      rep: StepStatus,
    ): ProcessStep[] => [
      { id: 'gate', name: 'Revue documentaire', status: gate, targetRoute: 'gate' },
      { id: 'financials', name: 'Financiers & Ratios', status: fin, targetRoute: 'financials' },
      { id: 'scoring', name: 'Scoring & Tension', status: scor, targetRoute: 'tension' },
      { id: 'expert', name: 'Avis expert', status: exp, targetRoute: 'expert' },
      { id: 'report', name: 'Rapport final', status: rep, targetRoute: 'rapport' },
    ];

    if (status === 'DRAFT' || status === 'PENDING_DOCS') {
      return buildSteps('ACTIVE', 'LOCKED', 'LOCKED', 'LOCKED', 'LOCKED');
    }
    if (status === 'PENDING_GATE' || status === 'FINANCIAL_INPUT') {
      return buildSteps('COMPLETED', 'ACTIVE', 'LOCKED', 'LOCKED', 'LOCKED');
    }
    if (status === 'NORMALIZATION_DONE' || status === 'RATIOS_COMPUTED') {
      return buildSteps('COMPLETED', 'COMPLETED', 'ACTIVE', 'LOCKED', 'LOCKED');
    }
    if (status === 'STRESS_DONE') {
      return buildSteps('COMPLETED', 'COMPLETED', 'COMPLETED', 'LOCKED', 'LOCKED'); // Stress done on Scoring pillar
    }
    if (status === 'SCORING_DONE') {
      return buildSteps('COMPLETED', 'COMPLETED', 'COMPLETED', 'ACTIVE', 'LOCKED');
    }
    if (status === 'EXPERT_REVIEWED') {
      return buildSteps('COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'ACTIVE');
    }
    if (status === 'REPORT_GENERATED' || status === 'CLOSED') {
      return buildSteps('COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED');
    }
    return buildSteps('LOCKED', 'LOCKED', 'LOCKED', 'LOCKED', 'LOCKED');
  }

  updateSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  setFilterMode(mode: 'ALL' | 'PENDING_GATE' | 'REQUIRE_ATTENTION' | 'READY_REPORT'): void {
    this.filterMode.set(mode);
  }

  goToStep(caseId: string, step: ProcessStep): void {
    if (step.status === 'LOCKED') return;
    this.router.navigate(['/cases', caseId, step.targetRoute]);
  }
}
