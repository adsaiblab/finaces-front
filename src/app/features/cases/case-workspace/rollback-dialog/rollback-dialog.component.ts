import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

export interface RollbackDialogResult {
    target_status: string;
    reason: string;
}

const ROLLBACK_OPTIONS = [
    { value: 'FINANCIAL_INPUT', label: '📋 Saisie financière — resaisir les données' },
    { value: 'NORMALIZATION_DONE', label: '📐 Normalisation — recalculer la normalisation' },
    { value: 'RATIOS_COMPUTED', label: '📊 Ratios — recalculer les ratios' },
    { value: 'SCORING_DONE', label: '🎯 Scoring — relancer le scoring' },
    { value: 'STRESS_DONE', label: '🧪 Stress test — relancer le stress test' },
];

@Component({
    selector: 'app-rollback-dialog',
    standalone: true,
    imports: [
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        FormsModule,
    ],
    template: `
    <h2 mat-dialog-title class="flex items-center gap-2">
      <mat-icon class="text-orange-500">history</mat-icon>
      Corriger une étape du workflow
    </h2>

    <mat-dialog-content class="flex flex-col gap-4 pt-2" style="min-width: 480px">
      <div class="rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-800">
        ⚠️ Cette action est <strong>irréversible</strong>. Toutes les données calculées
        après l'étape choisie seront <strong>définitivement supprimées</strong>.
      </div>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Revenir à l'étape</mat-label>
        <mat-select [(ngModel)]="targetStatus" required>
          @for (opt of options; track opt.value) {
            <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="w-full">
        <mat-label>Raison (obligatoire, min. 10 caractères)</mat-label>
        <textarea
          matInput
          [(ngModel)]="reason"
          rows="3"
          placeholder="Ex: Erreur de saisie sur le bilan 2023, les amortissements étaient incorrects."
        ></textarea>
        <mat-hint>{{ reason.length }} / 1000 caractères</mat-hint>
      </mat-form-field>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="gap-2">
      <button mat-stroked-button (click)="cancel()">Annuler</button>
      <button
        mat-flat-button
        color="warn"
        [disabled]="!canConfirm()"
        (click)="confirm()"
      >
        <mat-icon>warning</mat-icon>
        Confirmer la réinitialisation
      </button>
    </mat-dialog-actions>
  `,
})
export class RollbackDialogComponent {
    private readonly dialogRef = inject(MatDialogRef<RollbackDialogComponent, RollbackDialogResult>);

    readonly options = ROLLBACK_OPTIONS;
    targetStatus = '';
    reason = '';

    canConfirm(): boolean {
        return this.targetStatus !== '' && this.reason.trim().length >= 10;
    }

    confirm(): void {
        this.dialogRef.close({ target_status: this.targetStatus, reason: this.reason.trim() });
    }

    cancel(): void {
        this.dialogRef.close();
    }
}