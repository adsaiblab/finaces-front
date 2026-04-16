import { Component, ChangeDetectionStrategy, signal, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of, finalize } from 'rxjs';
import { delay } from 'rxjs/operators';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { CaseContextService } from '../../core/services/case-context.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';

import { FinancialStatementOut } from '../../core/models';
import { FinancialService } from '../../core/services/financial.service';
import { FinancialYearService } from '../../core/services/financial-year.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddYearDialogComponent } from './components/add-year-dialog.component';
import { FinancialMapper, AssetsFormValue, LiabilitiesFormValue, PnlFormValue, CashFlowFormValue, OthersFormValue } from '../../core/mappers/financial.mapper';

import {
  ExerciseSelectorComponent,
  BalanceCheckComponent,
  TabBalanceSheetAssetsComponent,
  TabBalanceSheetLiabilitiesComponent,
  TabIncomeStatementComponent,
  TabCashFlowComponent,
} from './components';
import { TabOthersComponent } from './components/tab-others/tab-others.component';

@Component({
  selector: 'app-financials',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    ExerciseSelectorComponent,
    BalanceCheckComponent,
    TabBalanceSheetAssetsComponent,
    TabBalanceSheetLiabilitiesComponent,
    TabIncomeStatementComponent,
    TabCashFlowComponent,
    TabOthersComponent,
    MatDialogModule,
  ],
  templateUrl: './financials.component.html',
  styleUrls: ['./financials.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialsComponent implements OnInit {
  private readonly caseContext = inject(CaseContextService);
  private readonly financialService = inject(FinancialService);
  private readonly financialYearService = inject(FinancialYearService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  public readonly caseId = signal<string>('');
  public readonly activeTab = signal<'assets' | 'liabilities' | 'pnl' | 'cashflow' | 'others'>('assets');

  // Multi-year State
  public readonly availableYears = signal<number[]>([]);
  public readonly currentExercise = signal<number | null>(null);
  
  // Loading & Saving states
  public readonly isSubmitting = signal<boolean>(false); // Normalization state
  public readonly isSaving = signal<boolean>(false);     // Save Draft state
  public readonly isLoading = signal<boolean>(false);    // Initial load state
  public readonly isDirty = signal<boolean>(false);

  // Local registry of financial data per year (Mapped for UI)
  public readonly statementsMap = signal<Map<number, any>>(new Map());

  // Current Exercise Draft (derived from statementsMap for sub-components inputs)
  public get assetsDraft(): AssetsFormValue | null { return this.currentExercise() ? this.statementsMap().get(this.currentExercise()!)?.assets || null : null; }
  public get liabilitiesDraft(): LiabilitiesFormValue | null { return this.currentExercise() ? this.statementsMap().get(this.currentExercise()!)?.liabilities || null : null; }
  public get pnlDraft(): PnlFormValue | null { return this.currentExercise() ? this.statementsMap().get(this.currentExercise()!)?.pnl || null : null; }
  public get cashflowDraft(): CashFlowFormValue | null { return this.currentExercise() ? this.statementsMap().get(this.currentExercise()!)?.cashflow || null : null; }
  public get othersDraft(): OthersFormValue | null { return this.currentExercise() ? this.statementsMap().get(this.currentExercise()!)?.others || null : null; }

  // Balance Check signals
  public readonly currentAssetsTotal = signal<number>(0);
  public readonly currentLiabilitiesTotal = signal<number>(0);

  constructor() {
    this.caseId.set(this.caseContext.caseId());
  }

  ngOnInit(): void {
    this.loadFinancials();
  }

  private loadFinancials(): void {
    if (!this.caseId()) return;

    this.isLoading.set(true);
    this.financialService.getFinancialStatements(this.caseId())
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (statements) => {
          const map = new Map<number, any>();
          const years: number[] = [];
          
          statements.forEach(s => {
            try {
              map.set(s.fiscal_year, FinancialMapper.fromApi(s));
              years.push(s.fiscal_year);
            } catch (e) {
              console.error(`[Financials] Erreur mapping année ${s.fiscal_year}:`, e);
            }
          });

          });

          const sortedYears = years.sort((a,b) => b-a);
          this.statementsMap.set(map);
          this.availableYears.set(sortedYears);
          
          if (sortedYears.length > 0 && !this.currentExercise()) {
            this.currentExercise.set(sortedYears[0]);
          }
          
          // Trigger initial totals display if selected exists
          if (this.currentExercise()) {
            const current = map.get(this.currentExercise()!);
            if (current) {
              this.currentAssetsTotal.set(current.assets.totalAssets || 0);
              this.currentLiabilitiesTotal.set(current.liabilities.totalLiabilities || 0);
            }
          }
        },
        error: (err) => {
          this.snackBar.open('Erreur lors du chargement des données', 'Recommencer', { duration: 5000 });
        }
      });
  }

  public openAddYearDialog(): void {
    const dialogRef = this.dialog.open(AddYearDialogComponent, { width: '400px' });

    dialogRef.afterClosed().subscribe(year => {
      if (year && !this.availableYears().includes(year)) {
        this.snackBar.open(`Création de l'exercice ${year}...`, '', { duration: 2000 });
        this.financialYearService.addFiscalYear(this.caseId(), year)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open(`Exercice ${year} créé`, 'OK', { duration: 3000, panelClass: 'snack-success' });
              this.currentExercise.set(year);
              this.loadFinancials();
            },
            error: (err) => {
              if (err.status === 409) {
                this.snackBar.open(`L'année ${year} existe déjà pour ce dossier.`, 'OK', { duration: 3000 });
              } else {
                this.snackBar.open(`Erreur de création`, 'OK', { duration: 3000 });
              }
            }
          });
      } else if (year) {
        this.snackBar.open(`L'année ${year} existe déjà.`, 'OK', { duration: 3000 });
      }
    });
  }

  public onYearChange(year: number): void {
    if (year === this.currentExercise()) return;

    // Auto-save current draft if dirty
    if (this.isDirty()) {
      this.saveDraft(false); // background save
    }

    this.currentExercise.set(year);
    this.isDirty.set(false);

    // Refresh totals for balance check
    const data = this.statementsMap().get(year);
    this.currentAssetsTotal.set(data?.assets?.totalAssets || 0);
    this.currentLiabilitiesTotal.set(data?.liabilities?.totalLiabilities || 0);
  }

  public onAssetsUpdate(event: { total: number; data: AssetsFormValue }): void {
    this.updateLocalDraft('assets', event.data);
    this.currentAssetsTotal.set(event.total);
    this.isDirty.set(true);
  }

  public onLiabilitiesUpdate(event: { total: number; data: LiabilitiesFormValue }): void {
    this.updateLocalDraft('liabilities', event.data);
    this.currentLiabilitiesTotal.set(event.total);
    this.isDirty.set(true);
  }

  public onPnlUpdate(event: { netIncome: number; ebitda: number; data: PnlFormValue }): void {
    this.updateLocalDraft('pnl', event.data);
    this.isDirty.set(true);
  }

  public onCashFlowUpdate(event: { netCashFlow: number; data: CashFlowFormValue }): void {
    this.updateLocalDraft('cashflow', event.data);
    this.isDirty.set(true);
  }

  public onOthersUpdate(event: { data: OthersFormValue }): void {
    this.updateLocalDraft('others', event.data);
    this.isDirty.set(true);
  }

  private updateLocalDraft(tab: string, data: any): void {
    if (!this.currentExercise()) return;
    this.statementsMap.update(map => {
      let yearData = map.get(this.currentExercise()!) || { assets: {}, liabilities: {}, pnl: {}, cashflow: {}, others: {} };
      yearData = { ...yearData, [tab]: data };
      map.set(this.currentExercise()!, yearData);
      return new Map(map); // New reference to trigger signal
    });
  }

  public saveDraft(showNotification: boolean = true): void {
    if (!this.caseId() || !this.currentExercise()) return;

    const currentYearData = this.statementsMap().get(this.currentExercise()!);
    if (!currentYearData) return;

    const others = currentYearData.others || {};
    const payload = FinancialMapper.toApi(this.currentExercise()!, others, currentYearData);

    this.isSaving.set(true);
    this.financialService.createFinancialStatement(this.caseId(), payload)
      .pipe(
        finalize(() => {
          this.isSaving.set(false);
          this.isDirty.set(false);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (res) => {
          if (showNotification) {
            this.snackBar.open('Brouillon sauvegardé avec succès', 'OK', { duration: 3000, panelClass: 'snack-success' });
          }
          // Update local map with potential new ID/timestamps from API
          this.statementsMap.update(map => {
            map.set(res.fiscal_year, FinancialMapper.fromApi(res));
            return new Map(map);
          });
        },
        error: (err) => {
          this.snackBar.open('Erreur lors de la sauvegarde', 'OK', { duration: 4000 });
        }
      });
  }

  public triggerNormalization(): void {
    this.isSubmitting.set(true);
    this.snackBar.open('Normalisation en cours...', '', { duration: 2000 });

    this.financialService.normalizeFinancials(this.caseId())
      .pipe(
        finalize(() => this.isSubmitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Normalisation terminée avec succès', 'OK', {
            duration: 3000,
            panelClass: 'snack-success',
          });
          this.router.navigate(['/cases', this.caseId(), 'normalization']);
        },
        error: () => {
          this.snackBar.open('Erreur lors de la normalisation', 'OK', { duration: 5000 });
        }
      });
  }
}
