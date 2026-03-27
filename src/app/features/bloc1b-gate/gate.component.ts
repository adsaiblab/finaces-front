import { AsyncPipe, NgClass, DOCUMENT } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject, DestroyRef, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Observable, BehaviorSubject, Subject, timer, of } from 'rxjs';
import { switchMap, shareReplay, catchError, tap, filter, delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

import { CaseService } from '../../core/services/case.service';
import { DocumentService } from '../../core/services/document.service';
import { EvaluationCaseDetailOut } from '../../core/models';
import { GateDocumentOut, GateDecisionSchema } from '../../core/models/gate.model';

import { ChecklistColumnComponent } from './components/checklist-column/checklist-column.component';
import { DocumentsColumnComponent } from './components/documents-column/documents-column.component';
import { DecisionColumnComponent } from './components/decision-column/decision-column.component';
import { DocumentUploadDialogComponent } from './components/document-upload-dialog/document-upload-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/molecules/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-gate',
  standalone: true,
  imports: [MatDialogModule,
    MatSnackBarModule,
    MatIconModule,
    MatButtonModule,
    ChecklistColumnComponent,
    DocumentsColumnComponent,
    DecisionColumnComponent, AsyncPipe, NgClass],
  templateUrl: './gate.component.html',
  styleUrl: './gate.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GateComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private caseService = inject(CaseService);
  private documentService = inject(DocumentService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private manualRefresh$ = new BehaviorSubject<void>(undefined);

  caseId = signal<string>('');
  case$!: Observable<EvaluationCaseDetailOut>;
  documents$!: Observable<GateDocumentOut[]>;

  // State subjects pour la décision
  private decisionSubject = new BehaviorSubject<GateDecisionSchema | null>(null);
  decision$ = this.decisionSubject.asObservable();

  private isEvaluatingSubject = new BehaviorSubject<boolean>(false);
  isEvaluating$ = this.isEvaluatingSubject.asObservable();

  ngOnInit(): void {
    // L'ID '/cases/:id' se trouve dans les paramètres de la route parente (CaseWorkspace)
    const id = this.route.parent?.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('id') || '';
    this.caseId.set(id);

    if (!this.caseId()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    // 1. Fetch Case Details
    const mockCase = {
        id: this.caseId(),
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
    } as EvaluationCaseDetailOut;

    const caseReq$ = environment.features.mockData ? of(mockCase).pipe(delay(400)) : this.caseService.getCaseDetail(this.caseId());

    this.case$ = caseReq$.pipe(
      catchError((err) => {
        this.snackBar.open('Case not strictly found on server.', 'Close', { duration: 3000 });
        throw err;
      }),
      shareReplay(1)
    );

    // 2. Setup Document Polling (Toutes les 2s + rafraîchissement manuel)
    this.documents$ = this.manualRefresh$.pipe(
      switchMap(() => timer(0, 2000)),
      switchMap(() => this.documentService.getGateDocuments(this.caseId()).pipe(
        catchError(() => of([])) // Sécurité si erreur réseau
      )),
      takeUntilDestroyed(this.destroyRef),
      shareReplay(1)
    );
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
        return this.documentService.uploadGateDocument(this.caseId(), formData);
      }),
      takeUntilDestroyed(this.destroyRef)
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
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { message: 'Voulez-vous vraiment supprimer ce document ?' }
    });
    dialogRef.afterClosed().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(confirmed => {
      if (confirmed) {
        this.documentService.deleteDocument(this.caseId(), docId).pipe(
          takeUntilDestroyed(this.destroyRef)
        ).subscribe({
          next: () => {
            this.snackBar.open('Document supprimé', 'Fermer', { duration: 3000 });
            this.manualRefresh$.next();
          },
          error: () => this.snackBar.open('Erreur de suppression', 'Fermer', { duration: 3000, panelClass: 'snack-error' })
        });
      }
    });
  }

  onDownloadDocument(docId: string): void {
    this.documentService.downloadDocument(this.caseId(), docId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const a = this.document.createElement('a');
      a.href = url;
      a.download = `document-${docId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  onViewDetails(doc: GateDocumentOut): void {
    // Optionnel: Ouvrir un dialog de détails en Read-Only
    this.snackBar.open(`Détails du document: ${doc.filename}`, 'Fermer', { duration: 2000 });
  }

  // --- ACTIONS COLONNE 3 (DECISION) ---

  onEvaluateGate(): void {
    this.isEvaluatingSubject.next(true);
    this.decisionSubject.next(null);

    const evaluate$ = environment.features.mockData
      ? of({
          id: 'mock-decision-id',
          case_id: this.caseId(),
          is_passed: true,
          verdict: 'PASSED',
          reliability_level: 'HIGH',
          reliability_score: 87,
          blocking_reasons: [],
          reserve_flags: [],
          missing_docs: [],
          documents_received: {
            'BILAN': [2023, 2022, 2021],
            'CPC': [2023, 2022, 2021],
            'TFT': [2023, 2022, 2021],
            'ATTESTATION_FISCALE': [2023, 2022, 2021],
            'STATUTS': []
          },
          audit_log: [],
          evaluated_at: new Date().toISOString(),
          evaluated_by: 'mock-engine'
        } as GateDecisionSchema).pipe(delay(1500))
      : this.caseService.evaluateGate(this.caseId());

    evaluate$.pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError((err) => {
        this.isEvaluatingSubject.next(false);
        this.snackBar.open('Evaluation failed: backend error.', 'Close', { duration: 4000, panelClass: 'snack-error' });
        throw err;
      })
    ).subscribe({
      next: (decision) => {
        this.decisionSubject.next(decision);
        this.isEvaluatingSubject.next(false);
      }
    });
  }

  onSealGate(): void {
    this.caseService.patchCaseStatus(this.caseId(), 'FINANCIAL_INPUT').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.snackBar.open('Gate scellé. Financials déverrouillés.', 'Fermer', { duration: 3000, panelClass: 'snack-success' });
        this.router.navigate([`/cases/${this.caseId()}/financials`]);
      },
      error: () => {
        this.snackBar.open('Erreur lors du scellement du Gate', 'Fermer', { duration: 3000, panelClass: 'snack-error' });
      }
    });
  }

  onGoToFinancials(): void {
    this.router.navigate([`/cases/${this.caseId()}/financials`]);
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