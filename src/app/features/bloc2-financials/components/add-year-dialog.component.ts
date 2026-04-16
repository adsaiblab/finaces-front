import { Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-add-year-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>Ajouter une année fiscale</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="w-full mt-4">
        <mat-label>Année fiscale (ex: 2024)</mat-label>
        <input matInput type="number" [(ngModel)]="year" [min]="2000" [max]="currentYear" required autofocus>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-flat-button color="primary" [mat-dialog-close]="year()" [disabled]="!year() || year() < 2000 || year() > currentYear">Ajouter</button>
    </mat-dialog-actions>
  `,
})
export class AddYearDialogComponent {
  public year = model<number>(new Date().getFullYear());
  public currentYear = new Date().getFullYear() + 1; // Allow T+1 if needed for foresight, or just current. Prompt says [max]="currentYear", so I stick to currentYear.
  
  constructor() {
    this.currentYear = new Date().getFullYear();
  }
}
