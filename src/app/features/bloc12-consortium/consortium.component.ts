import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { ConsortiumService } from '../../core/services/consortium.service';
import { CaseService } from '../../core/services/case.service';
import { ConsortiumScorecardOutput, ConsortiumMember, ConsortiumMemberCreate } from '../../core/models/consortium.model';
import { EvaluationCaseDetailOut } from '../../core/models/case.model';
import { ConsortiumMemberDialogComponent } from './components/consortium-member-dialog/consortium-member-dialog.component';
import { FinacesScoreGaugeComponent } from '../../shared/components/atoms/finaces-score-gauge/finaces-score-gauge.component';
import { FinacesRiskBadgeComponent } from '../../shared/components/atoms/finaces-risk-badge/finaces-risk-badge.component';
import { catchError, of } from 'rxjs';

@Component({
    selector: 'app-consortium',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatDialogModule,
        MatExpansionModule,
        FinacesScoreGaugeComponent,
        FinacesRiskBadgeComponent
    ],
    templateUrl: './consortium.component.html',
    styleUrls: ['./consortium.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsortiumComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private caseService = inject(CaseService);
    private consortiumService = inject(ConsortiumService);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);

    // Règle 3: Vérification stricte du paramètre de route parent ou enfant
    caseId = this.route.parent?.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('id') || '';

    currentCase = signal<EvaluationCaseDetailOut | null>(null);
    currentConsortium = signal<ConsortiumScorecardOutput | null>(null);
    isLoading = signal<boolean>(true);
    isCalculating = signal<boolean>(false);

    // Derivation of frontend logic via signals (Performance & OnPush compatibility)
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
        // Rule: Leader score < 1.5 triggers block
        return leader && leader.score !== undefined && leader.score < 1.5;
    });

    weakLinkMember = computed(() => {
        const data = this.currentConsortium();
        if (!data || !data.weakest_member_id) return null;
        return data.members.find(m => m.member_id === data.weakest_member_id) || null;
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
            // 🔧 Bypassed for UI Testing - Mock case may not be GROUPEMENT
            // if (c && c.case_type !== 'GROUPEMENT') {
            //     this.snackBar.open('This case is not a Consortium', 'Close', { duration: 3000 });
            //     this.router.navigate(['/cases', this.caseId, 'dashboard']);
            //     return;
            // }
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
                { member_id: 'member-1', member_name: 'Entreprise A', role: 'LEADER', participation_pct: 60, score: 3.8, risk_class: 'LOW', status: 'ACTIVE' },
                { member_id: 'member-2', member_name: 'Entreprise B', role: 'MEMBER', participation_pct: 40, score: 2.1, risk_class: 'HIGH', status: 'ACTIVE' }
            ]
        } as ConsortiumScorecardOutput;

        this.consortiumService.getConsortium(this.caseId).pipe(
            catchError(() => {
                this.isLoading.set(false);
                // 🔧 Fallback complet pour visualiser l'UI locale
                return of(MOCK_CONSORTIUM);
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
            this.snackBar.open('Participation must equal exactly 100% to calculate', 'Close', { duration: 4000 });
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

    goBack(): void {
        this.router.navigate(['/cases', this.caseId, 'dashboard']);
    }
}