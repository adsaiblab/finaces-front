import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, FormArray } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';

import { ConsortiumService } from '../../core/services/consortium.service';
import { CaseService } from '../../core/services/case.service';
import { ConsortiumScorecardOutput, ConsortiumMember, ConsortiumMemberCreate } from '../../core/models/consortium.model';
import { EvaluationCaseDetailOut } from '../../core/models/case.model';
import { ConsortiumMemberDialogComponent } from './components/consortium-member-dialog/consortium-member-dialog.component';
import { ConsortiumMemberAccordionComponent } from './components/consortium-member-accordion/consortium-member-accordion.component';
import { FinacesScoreGaugeComponent } from '../../shared/components/atoms/finaces-score-gauge/finaces-score-gauge.component';
import { FinacesRiskBadgeComponent } from '../../shared/components/atoms/finaces-risk-badge/finaces-risk-badge.component';
import { catchError, of, delay } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
    selector: 'app-consortium',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatTabsModule,
        ConsortiumMemberAccordionComponent,
        FinacesScoreGaugeComponent,
        FinacesRiskBadgeComponent
    ],
    templateUrl: './consortium.component.html',
    styleUrls: ['./consortium.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsortiumComponent implements OnInit {
    private route = inject(ActivatedRoute);
    public router = inject(Router);
    private caseService = inject(CaseService);
    private consortiumService = inject(ConsortiumService);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);
    private fb = inject(FormBuilder);

    // Règle 3: Route param retrieval
    caseId = this.route.parent?.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('id') || '';

    currentCase = signal<EvaluationCaseDetailOut | null>(null);
    currentConsortium = signal<ConsortiumScorecardOutput | null>(null);
    isLoading = signal<boolean>(true);
    isCalculating = signal<boolean>(false);

    // Track inline editing state for shares [P18 Requirement]
    isEditingShares = signal<boolean>(false);

    // Derivations via Signals
    totalParticipation = computed(() => {
        const data = this.currentConsortium();
        if (!data || !data.members) return 0;
        return data.members.reduce((sum, m) => sum + m.participation_pct, 0);
    });

    leaderMember = computed(() => {
        return this.currentConsortium()?.members?.find(m => m.role === 'LEADER') || null;
    });

    isLeaderBlocking = computed(() => {
        const leader = this.leaderMember();
        return !!(leader && leader.score !== undefined && leader.score < 1.5);
    });

    weakLinkMemberId = computed(() => {
        return this.currentConsortium()?.weakest_member_id || null;
    });

    // [UI SIMULATION] - Derive detailed combined scores for full view targets
    detailedCombinedPillars = computed(() => {
        const mems = this.currentConsortium()?.members || [];
        if (mems.length === 0) return {};

        // Simplistic weighted average from member scores to simulate real data
        const combinedFinalScore = this.currentConsortium()?.combined_scorecard?.final_score || 0;

        const generateCombinedPillar = (offset: number) => {
            const score = Math.max(1, Math.min(5, combinedFinalScore + offset));
            let label: any = 'MODERATE';
            if (score >= 4) label = 'STRONG';
            if (score < 2) label = 'WEAK';
            return { score, label };
        };

        return {
            liquidity: generateCombinedPillar(0.3),
            solvency: generateCombinedPillar(-0.2),
            profitability: generateCombinedPillar(0.1),
            capacity: generateCombinedPillar(-0.4),
            quality: generateCombinedPillar(0.5)
        } as Record<string, { score: number, label: string }>;
    });

    ngOnInit(): void {
        if (!this.caseId) {
            this.router.navigate(['/dashboard']);
            return;
        }
        this.loadData();
    }

    private loadData(): void {
        this.isLoading.set(true);
        this.caseService.getCaseDetail(this.caseId).pipe(
            catchError(() => {
                this.snackBar.open('Error loading case', 'Close');
                return of(null);
            })
        ).subscribe((c: EvaluationCaseDetailOut | null) => {
            this.currentCase.set(c);
            this.loadConsortium();
        });
    }

    private loadConsortium(): void {
        const MOCK_CONSORTIUM: ConsortiumScorecardOutput = {
            joint_venture_type: 'SOLIDAIRE',
            synergy_index: 0.5,
            weakest_member_id: 'member-2',
            combined_scorecard: {
                final_score: 3.45,
                risk_class: 'MODERATE'
            },
            members: [
                { member_id: 'member-1', member_name: 'TechCorp Leader', role: 'LEADER', participation_pct: 60, score: 3.8, risk_class: 'LOW', status: 'ACTIVE' },
                { member_id: 'member-2', member_name: 'OpsLink Partner', role: 'MEMBER', participation_pct: 40, score: 2.1, risk_class: 'HIGH', status: 'ACTIVE' }
            ]
        } as ConsortiumScorecardOutput;

        const req$ = environment.features.mockData 
            ? of(MOCK_CONSORTIUM).pipe(delay(800))
            : this.consortiumService.getConsortium(this.caseId);

        req$.pipe(
            catchError((err) => {
                this.isLoading.set(false);
                this.snackBar.open('Erreur de chargement du consortium (backend)', 'Close');
                throw err;
            })
        ).subscribe(data => {
            if (data) this.currentConsortium.set(data);
            this.isLoading.set(false);
        });
    }

    openMemberDialog(member?: ConsortiumMember): void {
        const dialogRef = this.dialog.open(ConsortiumMemberDialogComponent, {
            width: '500px',
            data: { member }
        });

        dialogRef.afterClosed().subscribe((result: ConsortiumMemberCreate) => {
            if (result) {
                this.isLoading.set(true);
                const req$ = member
                    ? this.consortiumService.updateMember(this.caseId, member.member_id, result)
                    : this.consortiumService.addMember(this.caseId, result);

                req$.subscribe({
                    next: (res) => {
                        this.currentConsortium.set(res);
                        this.isLoading.set(false);
                        this.snackBar.open('Member updated successfully', 'Close', { duration: 3000 });
                    },
                    error: () => {
                        this.isLoading.set(false);
                        this.snackBar.open('Error updating member', 'Close', { duration: 3000 });
                    }
                });
            }
        });
    }

    // Handle inline share editing submission [P18 Requirement]
    saveSharesInline(editedShares: Record<string, number>): void {
        if (this.totalParticipation() !== 100) {
            this.snackBar.open('Total shares must be 100%', 'Close');
            return;
        }
        this.isLoading.set(true);
        // Actual implementation would need separate patching or multi-patching endpoints per backend spec.
        this.snackBar.open('Inline share updates saved successfully (simulated endpoint)', 'Close');
        this.isEditingShares.set(false);
        this.isLoading.set(false);
    }

    removeMember(memberId: string): void {
        if (confirm('Are you sure you want to remove this member?')) {
            this.isLoading.set(true);
            this.consortiumService.removeMember(this.caseId, memberId).subscribe({
                next: (res) => {
                    this.currentConsortium.set(res);
                    this.isLoading.set(false);
                },
                error: () => {
                    this.isLoading.set(false);
                    this.snackBar.open('Error removing member', 'Close', { duration: 3000 });
                }
            });
        }
    }

    recalculateScore(): void {
        if (this.totalParticipation() !== 100) {
            this.snackBar.open('Participation must equal exactly 100%', 'Close', { duration: 3000 });
            return;
        }

        this.isCalculating.set(true);
        this.consortiumService.calculateConsortium(this.caseId).subscribe({
            next: (res) => {
                this.currentConsortium.set(res);
                this.isCalculating.set(false);
                this.snackBar.open('Scores recalculated successfully', 'Close', { duration: 3000 });
            },
            error: () => {
                this.isCalculating.set(false);
                this.snackBar.open('Calculation failed', 'Close', { duration: 3000 });
            }
        });
    }

    continueToStress(): void {
        this.router.navigate(['/cases', this.caseId, 'stress']);
    }
}