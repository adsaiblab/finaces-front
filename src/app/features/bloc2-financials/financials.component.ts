import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';

// L'IMPORT DU BARREL FILE MAGIQUE
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
    // Nos sous-composants vitaux
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
  public caseId = signal<string>('');

  // Gestion des exercices
  public availableYears = signal<number[]>([2023, 2022, 2021]);
  public currentExercise = signal<number>(2023);

  // État de l'UI
  public isSubmitting = signal<boolean>(false);

  // État des Totaux (Pour le Balance Check en temps réel)
  public currentAssetsTotal = signal<number>(0);
  public currentLiabilitiesTotal = signal<number>(0);

  constructor(private route: ActivatedRoute, private router: Router) {
    const resolvedId = this.route.parent?.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('id') || '';
    this.caseId.set(resolvedId);
  }

  // --- HANDLERS D'ÉVÉNEMENTS ENFANTS ---

  public onYearChange(year: number): void {
    this.currentExercise.set(year);
    // Ici on chargerait idéalement les données sauvegardées pour l'année via l'API
  }

  public onAssetsUpdate(event: { total: number, data: any }): void {
    this.currentAssetsTotal.set(event.total);
    // Sauvegarde en brouillon (Mock)
  }

  public onLiabilitiesUpdate(event: { total: number, data: any }): void {
    this.currentLiabilitiesTotal.set(event.total);
  }

  public onPnlUpdate(event: { netIncome: number, ebitda: number, data: any }): void {
    // Handling P&L
  }

  public onCashFlowUpdate(event: { netCashFlow: number, data: any }): void {
    // Handling Cashflow
  }

  // Flux de validation (Mock)
  public triggerNormalization(): void {
    this.isSubmitting.set(true);
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.router.navigate(['/cases', this.caseId(), 'normalization']);
    }, 1200);
  }
}