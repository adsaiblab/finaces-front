import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Observable, BehaviorSubject, Subject, timer, of } from 'rxjs';
import { switchMap, takeUntil, shareReplay, catchError, tap, filter } from 'rxjs/operators';

import { CaseService } from '../../core/services/case.service';
import { DocumentService } from '../../core/services/document.service';
import { EvaluationCaseDetailOut } from '../../core/models';
import { GateDocumentOut, GateDecisionSchema } from '../../core/models/gate.model';

import { ChecklistColumnComponent } from './components/checklist-column/checklist-column.component';
import { DocumentsColumnComponent } from './components/documents-column/documents-column.component';
import { DecisionColumnComponent } from './components/decision-column/decision-column.component';
import { DocumentUploadDialogComponent } from './components/document-upload-dialog/document-upload-dialog.component';

@Component({
  selector: 'app-gate',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatSnackBarModule,
    MatIconModule,
    MatButtonModule,
    ChecklistColumnComponent,
    DocumentsColumnComponent,
    DecisionColumnComponent
  ],
  templateUrl: './gate.component.html',
  styleUrl: './gate.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GateComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private caseService = inject(CaseService);
  private documentService = inject(DocumentService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private destroy$ = new Subject<void>();
  private manualRefresh$ = new BehaviorSubject<void>(undefined);

  caseId!: string;
  case$!: Observable<EvaluationCaseDetailOut>;
  documents$!: Observable<GateDocumentOut[]>;

  // State subjects pour la décision
  private decisionSubject = new BehaviorSubject<GateDecisionSchema | null>(null);
  decision$ = this.decisionSubject.asObservable();

  private isEvaluatingSubject = new BehaviorSubject<boolean>(false);
  isEvaluating$ = this.isEvaluatingSubject.asObservable();

  ngOnInit(): void {
    // L'ID '/cases/:id' se trouve dans les paramètres de la route parente (CaseWorkspace)
    this.caseId = this.route.parent?.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('id') || '';

    if (!this.caseId) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // 1. Fetch Case Details
    this.case$ = this.caseService.getCaseDetail(this.caseId).pipe(
      catchError(() => of({
        id: this.caseId,
        name: 'Dossier de Simulation',
        bidder_name: 'Entreprise Fictive SA',
        country: 'France',
        sector: 'BTP',
        contract_value: 1500000,
        contract_currency: 'EUR',
        contract_months: 24,
        case_type: 'SINGLE' as any,
        status: 'PENDING_GATE' as any,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'admin'
      } as EvaluationCaseDetailOut)),
      shareReplay(1)
    );

    // 2. Setup Document Polling (Toutes les 2s + rafraîchissement manuel)
    this.documents$ = this.manualRefresh$.pipe(
      switchMap(() => timer(0, 2000)),
      switchMap(() => this.documentService.getGateDocuments(this.caseId).pipe(
        catchError(() => of([])) // Sécurité si erreur réseau
      )),
      takeUntil(this.destroy$),
      shareReplay(1)
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // --- ACTIONS COLONNE 2 (DOCUMENTS) ---

  onFileDropped(file: File): void {
    const dialogRef = this.dialog.open(DocumentUploadDialogComponent, {
      width: '500px',
      disableClose: true,
      data: { file }
    });

    dialogRef.afterClosed().pipe(
      filter(result => !!result),
      switchMap(result => {
        const formData = new FormData();
        formData.append('file', result.file);
        Object.keys(result.metadata).forEach(key => {
          if (result.metadata[key]) {
            formData.append(key, result.metadata[key]);
          }
        });
        return this.documentService.uploadGateDocument(this.caseId, formData);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Document uploadé avec succès', 'Fermer', { duration: 3000, panelClass: 'snack-success' });
        this.manualRefresh$.next(); // Force refresh
      },
      error: () => {
        this.snackBar.open('Erreur lors de l\'upload', 'Fermer', { duration: 3000, panelClass: 'snack-error' });
      }
    });
  }

  onDeleteDocument(docId: string): void {
    if (confirm('Voulez-vous vraiment supprimer ce document ?')) {
      this.documentService.deleteDocument(this.caseId, docId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.snackBar.open('Document supprimé', 'Fermer', { duration: 3000 });
          this.manualRefresh$.next();
        },
        error: () => this.snackBar.open('Erreur de suppression', 'Fermer', { duration: 3000, panelClass: 'snack-error' })
      });
    }
  }

  onDownloadDocument(docId: string): void {
    // Dans un vrai projet, on gèrerait le blob. Ici on simule une ouverture d'URL.
    this.snackBar.open('Téléchargement démarré...', 'Fermer', { duration: 2000 });
  }

  onViewDetails(doc: GateDocumentOut): void {
    // Optionnel: Ouvrir un dialog de détails en Read-Only
    this.snackBar.open(`Détails du document: ${doc.filename}`, 'Fermer', { duration: 2000 });
  }

  // --- ACTIONS COLONNE 3 (DECISION) ---

  onEvaluateGate(): void {
    this.isEvaluatingSubject.next(true);
    this.decisionSubject.next(null);

    this.caseService.evaluateGate(this.caseId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (decision) => {
        this.decisionSubject.next(decision);
        this.isEvaluatingSubject.next(false);
      },
      error: () => {
        this.snackBar.open('Échec de l\'évaluation Gate', 'Fermer', { duration: 3000, panelClass: 'snack-error' });
        this.isEvaluatingSubject.next(false);
      }
    });
  }

  onSealGate(): void {
    this.caseService.patchCaseStatus(this.caseId, 'FINANCIAL_INPUT').pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        this.snackBar.open('Gate scellé. Financials déverrouillés.', 'Fermer', { duration: 3000, panelClass: 'snack-success' });
        this.router.navigate([`/cases/${this.caseId}/financials`]);
      },
      error: () => {
        this.snackBar.open('Erreur lors du scellement du Gate', 'Fermer', { duration: 3000, panelClass: 'snack-error' });
      }
    });
  }

  onGoToFinancials(): void {
    this.router.navigate([`/cases/${this.caseId}/financials`]);
  }

  onCorrectDocuments(): void {
    // Logique pour scroller ou focus la zone d'upload
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.snackBar.open('Veuillez uploader les documents manquants.', 'Fermer', { duration: 3000 });
  }

  onGoToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}