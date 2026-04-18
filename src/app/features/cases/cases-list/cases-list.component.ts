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
  id: 'gate' | 'financials' | 'normalization' | 'ratios' | 'scoring' | 'ia' | 'tension' | 'stress' | 'expert' | 'report';
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
    const ALL_STEPS: { id: ProcessStep['id']; name: string; route: string }[] = [
      { id: 'gate',          name: 'Gate',          route: 'gate' },
      { id: 'financials',    name: 'Financials',    route: 'financials' },
      { id: 'normalization', name: 'Normalization', route: 'normalization' },
      { id: 'ratios',        name: 'Ratios',        route: 'ratios' },
      { id: 'scoring',       name: 'Scoring',       route: 'scoring-mcc' },
      { id: 'ia',            name: 'IA',            route: 'ia' },
      { id: 'tension',       name: 'Tension',       route: 'tension' },
      { id: 'stress',        name: 'Stress',        route: 'stress' },
      { id: 'expert',        name: 'Expert',        route: 'expert' },
      { id: 'report',        name: 'Report',        route: 'rapport' },
    ];

    // Index de l'étape active selon le statut backend (normalisé pour mapping robuste)
    const normalizedStatus = status.toUpperCase().replace(/_/g, '');
    
    const STATUS_ACTIVE_INDEX: Record<string, number> = {
      'DRAFT':              0,
      'PENDINGGATE':        0,
      'PENDING_GATE':       0,
      'FINANCIALINPUT':     1,
      'FINANCIAL_INPUT':    1,
      'NORMALIZATIONDONE':  2,
      'NORMALIZATION_DONE': 2,
      'RATIOSCOMPUTED':     3,
      'RATIOS_COMPUTED':    3,
      'SCORINGDONE':        4,
      'SCORING_DONE':       4,
      'SCORED':             4,          // ← alias utilisé dans les tests
      'STRESSDONE':         6,
      'STRESS_DONE':        6,
      'EXPERTREVIEWED':     9,
      'EXPERT_REVIEWED':    9,          // ← alias utilisé dans les tests
      'CLOSED':             9,
      'ARCHIVED':           9,
    };

    const activeIndex = STATUS_ACTIVE_INDEX[normalizedStatus] ?? 0;

    return ALL_STEPS.map((s, i) => ({
      id: s.id,
      name: s.name,
      targetRoute: s.route,
      status: i < activeIndex ? 'COMPLETED' : i === activeIndex ? 'ACTIVE' : 'LOCKED',
    }));
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
