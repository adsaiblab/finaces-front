import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CaseContextService } from '../../../core/services/case-context.service';
import { CaseService } from '../../../core/services/case.service';
import { AuthService } from '../../../core/services/auth.service';
import { RollbackDialogComponent } from './rollback-dialog/rollback-dialog.component';

@Component({
  selector: 'app-case-workspace',
  standalone: true,
  imports: [RouterModule, MatButtonModule, MatIconModule],
  templateUrl: './case-workspace.component.html',
  styleUrls: ['./case-workspace.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaseWorkspaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly caseContextService = inject(CaseContextService);
  private readonly caseService = inject(CaseService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly isRollingBack = signal(false);

  get canRollback(): boolean {
    return this.authService.currentUser() !== null;
  }

  get caseId(): string {
    return this.caseContextService.caseId();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.caseContextService.setCaseId(id);
  }

  openRollbackDialog(): void {
    const ref = this.dialog.open(RollbackDialogComponent, {
      disableClose: true,
      panelClass: 'rollback-dialog-panel',
    });

    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.isRollingBack.set(true);

      this.caseService.rollbackCase(this.caseId, result).subscribe({
        next: (res) => {
          this.isRollingBack.set(false);
          this.snackBar.open(
            `✅ Dossier réinitialisé à l'étape : ${res.new_status}`,
            'OK',
            { duration: 5000, panelClass: 'snack-success' }
          );
          // Recharge la page pour refleter le nouveau statut
          window.location.reload();
        },
        error: (err) => {
          this.isRollingBack.set(false);
          this.snackBar.open(
            `❌ Échec du rollback : ${err.message}`,
            'Fermer',
            { duration: 6000 }
          );
        },
      });
    });
  }
}
