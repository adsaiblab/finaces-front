import { Component, ChangeDetectionStrategy, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { CaseContextService } from '../../core/services/case-context.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';

import { FinancialStatementRawOut } from '../../core/models';

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
export class FinancialsComponent {
  private readonly caseContext = inject(CaseContextService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  public caseId = signal<string>('');

  // ✅ Le signal de routage interne pour piloter notre nouvelle Sidebar latérale
  public activeTab = signal<'assets' | 'liabilities' | 'pnl' | 'cashflow' | 'others'>('assets');

  public availableYears = signal<number[]>([2023, 2022, 2021]);
  public currentExercise = signal<number>(2023);
  public isSubmitting = signal<boolean>(false);

  // Signaux pour le Balance Check
  public currentAssetsTotal = signal<number>(0);
  public currentLiabilitiesTotal = signal<number>(0);

  constructor() {
    // Résolution robuste du caseId
    this.caseId.set(this.caseContext.caseId());
  }

  public onYearChange(year: number): void {
    this.currentExercise.set(year);
  }

  public onAssetsUpdate(event: { total: number; data: FinancialStatementRawOut }): void {
    this.currentAssetsTotal.set(event.total);
  }

  public onLiabilitiesUpdate(event: { total: number; data: FinancialStatementRawOut }): void {
    this.currentLiabilitiesTotal.set(event.total);
  }

  public onPnlUpdate(event: { netIncome: number; ebitda: number; data: FinancialStatementRawOut }): void {
    // KPI Updates
  }

  public onCashFlowUpdate(event: { netCashFlow: number; data: FinancialStatementRawOut }): void {
    // KPI Updates
  }

  public triggerNormalization(): void {
    this.isSubmitting.set(true);
    this.snackBar.open('Normalisation en cours...', '', { duration: 2000 });

    // Prototype Enterprise-Grade (Simulation sans backend)
    of(null).pipe(delay(1500), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.isSubmitting.set(false);
      this.snackBar.open('Normalisation terminée avec succès', 'OK', {
        duration: 3000,
        panelClass: 'snack-success',
      });
      this.router.navigate(['/cases', this.caseId(), 'normalization']);
    });
  }
}
