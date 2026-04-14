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
  ],
  templateUrl: './financials.component.html',
  styleUrls: ['./financials.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancialsComponent implements OnInit {
  private readonly caseContext = inject(CaseContextService);
  private readonly financialService = inject(FinancialService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  public readonly caseId = signal<string>('');
  public readonly activeTab = signal<'assets' | 'liabilities' | 'pnl' | 'cashflow' | 'others'>('assets');

  // Multi-year State
  public readonly availableYears = signal<number[]>([2023, 2022, 2021]);
  public readonly currentExercise = signal<number>(2023);
  
  // Loading & Saving states
  public readonly isSubmitting = signal<boolean>(false); // Normalization state
  public readonly isSaving = signal<boolean>(false);     // Save Draft state
  public readonly isLoading = signal<boolean>(false);    // Initial load state
  public readonly isDirty = signal<boolean>(false);

  // Local registry of financial data per year (Mapped for UI)
  public readonly statementsMap = signal<Map<number, any>>(new Map());

  // Current Exercise Draft (derived from statementsMap for sub-components inputs)
  public get assetsDraft(): AssetsFormValue | null { return this.statementsMap().get(this.currentExercise())?.assets || null; }
  public get liabilitiesDraft(): LiabilitiesFormValue | null { return this.statementsMap().get(this.currentExercise())?.liabilities || null; }
  public get pnlDraft(): PnlFormValue | null { return this.statementsMap().get(this.currentExercise())?.pnl || null; }
  public get cashflowDraft(): CashFlowFormValue | null { return this.statementsMap().get(this.currentExercise())?.cashflow || null; }
  public get othersDraft(): OthersFormValue | null { return this.statementsMap().get(this.currentExercise())?.others || null; }

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
            map.set(s.fiscal_year, FinancialMapper.fromApi(s));
            years.push(s.fiscal_year);
          });

          // Ensure 2023/2022/2021 presence if not in DB, but prioritize DB years
          [2023, 2022, 2021].forEach(y => {
            if (!years.includes(y)) years.push(y);
          });
          
          this.statementsMap.set(map);
          this.availableYears.set(years.sort((a,b) => b-a));
          
          // Trigger initial totals display if 2023 exists
          const current = map.get(this.currentExercise());
          if (current) {
            this.currentAssetsTotal.set(current.assets.totalAssets || 0);
            this.currentLiabilitiesTotal.set(current.liabilities.totalLiabilities || 0);
          }
        },
        error: (err) => {
          this.snackBar.open('Erreur lors du chargement des données', 'Recommencer', { duration: 5000 });
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
    const map = this.statementsMap();
    let yearData = map.get(this.currentExercise()) || { assets: {}, liabilities: {}, pnl: {}, cashflow: {}, others: {} };
    
    yearData = { ...yearData, [tab]: data };
    map.set(this.currentExercise(), yearData);
  }

  public saveDraft(showNotification: boolean = true): void {
    if (!this.caseId()) return;

    const currentYearData = this.statementsMap().get(this.currentExercise());
    if (!currentYearData) return;

    const others = currentYearData.others || {};
    const payload = FinancialMapper.toApi(this.currentExercise(), others, currentYearData);

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
          this.statementsMap().set(res.fiscal_year, FinancialMapper.fromApi(res));
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
