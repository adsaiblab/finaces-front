import { Component, ChangeDetectionStrategy, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { FinacesSkeletonLoaderComponent } from '../../../shared/components/molecules/finaces-skeleton-loader/finaces-skeleton-loader.component';
import { FinacesEmptyStateComponent } from '../../../shared/components/molecules/finaces-empty-state/finaces-empty-state.component';

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
        CommonModule,
        RouterModule,
        FormsModule,
        MatButtonModule,
        MatTooltipModule,
        FinacesSkeletonLoaderComponent,
        FinacesEmptyStateComponent
    ],
    templateUrl: './cases-list.component.html',
    styleUrls: ['./cases-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CasesListComponent implements OnInit {
    public router = inject(Router);

    cases = signal<HubCase[]>([]);
    isLoading = signal<boolean>(true);
    searchQuery = signal<string>('');
    filterMode = signal<'ALL' | 'PENDING_GATE' | 'REQUIRE_ATTENTION' | 'READY_REPORT'>('ALL');

    filteredCases = computed(() => {
        let result = this.cases();

        const query = this.searchQuery().toLowerCase().trim();
        if (query) {
            result = result.filter(c =>
                c.bidder_name.toLowerCase().includes(query) ||
                c.id.toLowerCase().includes(query)
            );
        }

        const mode = this.filterMode();
        if (mode !== 'ALL') {
            result = result.filter(c => {
                if (mode === 'PENDING_GATE') {
                    // Si l'étape "gate" est ACTIVE
                    return c.steps.find(s => s.id === 'gate')?.status === 'ACTIVE';
                }
                if (mode === 'REQUIRE_ATTENTION') {
                    // Alertes sur le scoring MCC/IA ou l'Expert Review
                    const scoring = c.steps.find(s => s.id === 'scoring');
                    const expert = c.steps.find(s => s.id === 'expert');
                    return scoring?.status === 'ACTIVE' || expert?.status === 'ACTIVE';
                }
                if (mode === 'READY_REPORT') {
                    return c.steps.find(s => s.id === 'report')?.status === 'ACTIVE';
                }
                return true;
            });
        }

        return result;
    });

    ngOnInit(): void {
        this.loadHubMock();
    }

    private loadHubMock(): void {
        this.isLoading.set(true);

        const buildSteps = (gate: StepStatus, fin: StepStatus, scor: StepStatus, exp: StepStatus, rep: StepStatus): ProcessStep[] => [
            { id: 'gate', name: 'Documentary Gate', status: gate, targetRoute: 'gate' },
            { id: 'financials', name: 'Financials & Ratios', status: fin, targetRoute: 'bilan' },
            { id: 'scoring', name: 'Scoring & Tension', status: scor, targetRoute: 'tension' },
            { id: 'expert', name: 'Expert Review', status: exp, targetRoute: 'expert-review' },
            { id: 'report', name: 'Final Report', status: rep, targetRoute: 'rapport' }
        ];

        const MOCK_DATA: HubCase[] = [
            { id: 'ca-9871x-12po', bidder_name: 'DurocDynamics GmbH', updated_at: '2026-03-26T09:12:00Z', assignee: 'Analyst A.', steps: buildSteps('COMPLETED', 'COMPLETED', 'ACTIVE', 'LOCKED', 'LOCKED') },
            { id: 'ca-1029y-90al', bidder_name: 'Titan Constructors', updated_at: '2026-03-25T14:30:00Z', assignee: 'Analyst B.', steps: buildSteps('COMPLETED', 'COMPLETED', 'COMPLETED', 'ACTIVE', 'LOCKED') },
            { id: 'ca-0912x-77wq', bidder_name: 'Nexus Infrastructure', updated_at: '2026-03-26T11:00:00Z', assignee: 'Unassigned', steps: buildSteps('ACTIVE', 'LOCKED', 'LOCKED', 'LOCKED', 'LOCKED') },
            { id: 'ca-4458z-88tr', bidder_name: 'NovaTech Supplies', updated_at: '2026-03-24T16:45:00Z', assignee: 'Drift Ops', steps: buildSteps('COMPLETED', 'ACTIVE', 'LOCKED', 'LOCKED', 'LOCKED') },
            { id: 'ca-8831y-55mn', bidder_name: 'Aeris Holdings', updated_at: '2026-03-20T10:15:00Z', assignee: 'Analyst A.', steps: buildSteps('COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED', 'ACTIVE') }
        ];

        // Règle OtherGuidance #2: Mock par timing natif rxjs
        of(MOCK_DATA).pipe(delay(800)).subscribe(data => {
            this.cases.set(data);
            this.isLoading.set(false);
        });
    }

    updateSearch(event: Event): void {
        const input = event.target as HTMLInputElement;
        this.searchQuery.set(input.value);
    }

    setFilterMode(mode: 'ALL' | 'PENDING_GATE' | 'REQUIRE_ATTENTION' | 'READY_REPORT'): void {
        this.filterMode.set(mode);
    }

    goToStep(caseId: string, step: ProcessStep): void {
        if (step.status === 'LOCKED') return; // Ne fait rien si verrouillé
        this.router.navigate(['/cases', caseId, step.targetRoute]);
    }
}
