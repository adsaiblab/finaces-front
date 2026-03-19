import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import {
  ExerciseSelectorComponent,
  BalanceCheckComponent,
  TabBalanceSheetAssetsComponent,
  TabBalanceSheetLiabilitiesComponent,
  TabIncomeStatementComponent,
  TabCashFlowComponent
} from './components';

@Component({
  selector: 'app-financials',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule,
    ExerciseSelectorComponent,
    BalanceCheckComponent,
    TabBalanceSheetAssetsComponent,
    TabBalanceSheetLiabilitiesComponent,
    TabIncomeStatementComponent,
    TabCashFlowComponent
  ],
  templateUrl: './financials.component.html',
  styleUrls: ['./financials.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinancialsComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  public caseId = signal<string>('');

  public availableYears = signal<number[]>([2023, 2022, 2021]);
  public currentExercise = signal<number>(2023);
  public isSubmitting = signal<boolean>(false);

  // Signaux pour le Balance Check
  public currentAssetsTotal = signal<number>(0);
  public currentLiabilitiesTotal = signal<number>(0);

  constructor() {
    // Résolution robuste du caseId
    const resolvedId = this.route.parent?.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('id') || '';
    this.caseId.set(resolvedId);
  }

  public onYearChange(year: number): void {
    this.currentExercise.set(year);
  }

  public onAssetsUpdate(event: { total: number, data: any }): void {
    this.currentAssetsTotal.set(event.total);
  }

  public onLiabilitiesUpdate(event: { total: number, data: any }): void {
    this.currentLiabilitiesTotal.set(event.total);
  }

  public onPnlUpdate(event: { netIncome: number, ebitda: number, data: any }): void {
    // KPI Updates
  }

  public onCashFlowUpdate(event: { netCashFlow: number, data: any }): void {
    // KPI Updates
  }

  public triggerNormalization(): void {
    this.isSubmitting.set(true);
    this.snackBar.open('Normalisation en cours...', '', { duration: 2000 });

    // Prototype Enterprise-Grade (Simulation sans backend)
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.snackBar.open('Normalisation terminée avec succès', 'OK', { duration: 3000, panelClass: ['bg-success', 'text-white'] });
      this.router.navigate(['/cases', this.caseId(), 'normalization']);
    }, 1500);
  }
}