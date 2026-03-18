═══════════════════════════════════════════════════════════
PROMPT 8 — BLOC 1B — Gate Documentaire (3 Colonnes + Upload + GateDecisionSchema)
Dépend de : PROMPT 7 (Création Dossier)
Peut être parallélisé avec : Aucun
═══════════════════════════════════════════════════════════

## CONTEXTE

Le **Gate Documentaire** est le contrôle d'accès préalable à toute évaluation financière. C'est une étape de **due diligence documentaire** obligatoire où:

1. L'utilisateur **documente** les justificatifs (bilan, CPC, TFT, attestation fiscale, statuts) pour 3 exercices fiscaux minimum
2. Le backend **évalue** la fiabilité et complétude des documents (intégrité fichiers, formats, datation)
3. Un **verdict** (PASSÉ / BLOQUÉ) est rendu par l'engine d'évaluation
4. Si PASSÉ: status dossier devient FINANCIAL_INPUT, autorisant l'entrée de données financières (P9)
5. Si BLOQUÉ: dossier reste en PENDING_GATE avec liste des raisons bloquantes

**Règle MCC-R6** : Gate must pass (is_passed=true) avant accès financials. C'est un **point de non-retour** dans le workflow.

Le gate affiche 3 colonnes:

- **Col 1 (Checklist)** : liste des documents requis avec progression
- **Col 2 (Upload & Documents)** : zone drag-drop + tableau documents existants
- **Col 3 (Décision Gate)** : résultat évaluation + verrous

---

## RÈGLES MÉTIER APPLICABLES

**MCC-R6** : Gate documentaire obligatoire et bloquante. Aucune donnée financière ne peut être saisie tant que gate n'est pas passé (is_passed=true).

**Documents Requis** (par exercice fiscal):

- **Bilan** (Actif/Passif)
- **CPC** (Compte de Résultat / P&L)
- **TFT** (Tableau de Flux de Trésorerie)
- **Attestation Fiscale** (paiement impôts)
- **Statuts** (articles de constitution/modification, optionnel mais recommandé)

Minimum 3 exercices fiscaux requis (n, n-1, n-2).

**Document Metadata** (à saisir lors upload):

- `document_type`: enum {BILAN, CPC, TFT, ATTESTATION_FISCALE, STATUTS, OTHER}
- `fiscal_year`: année (ex: 2023)
- `reliability_level`: enum {AUDITED, REVIEWED, COMPILED, UNAUDITED}
  - AUDITED: audit par Big 4 ou cabinet reconnu
  - REVIEWED: examen critique limité
  - COMPILED: préparés par comptable sans vérification
  - UNAUDITED: auto-préparés
- `auditor_name`: string optionnel (nom auditeur si AUDITED)
- `notes`: string optionnel (commentaires upload)

**Flags & Red Flags** :

- missing_required_docs: liste documents manquants par exercice
- file_integrity_issues: problèmes détectés (fichier corrompu, format invalide, etc.)
- date_anomalies: dates de signature invraisemblables
- conflicting_sources: données conflictuelles entre docs (ex: total bilan différent en CPC)

**GateEvaluation Result** :

```
{
  "is_passed": bool,
  "verdict": "PASSÉ" | "BLOQUÉ",
  "reliability_score": 0-100,
  "reliability_level": "HIGH" | "MEDIUM" | "LOW" | "CRITICAL",
  "blocking_reasons": [],
  "reserve_flags": [],
  "missing_docs": ["CPC 2023", ...],
  "audit_log": [...],
  "evaluated_at": datetime
}
```

**Status Transition** :

- PENDING_GATE (initial) → POST gate/evaluate
- Si is_passed=true → PATCH status FINANCIAL_INPUT → déverrouille accès financials
- Si is_passed=false → reste PENDING_GATE + affiche reasons bloquantes

---

## FICHIERS À CRÉER / MODIFIER

### Création

1. `src/app/pages/gate/gate.component.ts`
2. `src/app/pages/gate/gate.component.html`
3. `src/app/pages/gate/gate.component.scss`
4. `src/app/pages/gate/components/checklist-column.component.ts`
5. `src/app/pages/gate/components/checklist-column.component.html`
6. `src/app/pages/gate/components/checklist-column.component.scss`
7. `src/app/pages/gate/components/documents-column.component.ts`
8. `src/app/pages/gate/components/documents-column.component.html`
9. `src/app/pages/gate/components/documents-column.component.scss`
10. `src/app/pages/gate/components/decision-column.component.ts`
11. `src/app/pages/gate/components/decision-column.component.html`
12. `src/app/pages/gate/components/decision-column.component.scss`
13. `src/app/pages/gate/components/document-upload-dialog.component.ts`
14. `src/app/pages/gate/components/document-upload-dialog.component.html`

### Modification

1. `src/app/app.routes.ts` : ajouter route `/cases/:caseId/gate`
2. `src/app/services/case.service.ts` : ajouter méthodes gate (voir binding API)
3. `src/app/services/document.service.ts` : créer (uploadDocument, getDocuments, deleteDocument)
4. `src/app/models/gate.model.ts` : créer (GateDecisionSchema, DocumentOut, etc.)

---

## SPÉCIFICATION TECHNIQUE COMPLÈTE

### Route et Navigation

- **Route** : `/cases/:caseId/gate`
- **Breadcrumb** : "Dossiers > {ref} > Gate Documentaire"
- **Page Title** : "Gate Documentaire — {bidder_name}"

### Topbar Contextuelle

```
┌─────────────────────────────────────────────────────────┐
│ Gate Documentaire — Société XYZ SARL                    │
│ [Breadcrumb: Dossiers > MCC-2024-001 > Gate]            │
│ Status Badge: PENDING_GATE | Progression: 3/5 docs     │
└─────────────────────────────────────────────────────────┘
```

### Layout Principal (3 Colonnes)

```
┌─────────┬──────────────┬─────────┐
│ Col 1   │ Col 2        │ Col 3   │
│ 4/12    │ 5/12         │ 3/12    │
├─────────┼──────────────┼─────────┤
│Checklist│ Upload+Table │Decision │
│Requis   │              │Result   │
└─────────┴──────────────┴─────────┘
```

**Responsive** :

- Desktop (>1200px): 3 colonnes côte à côte
- Tablet (768-1200px): Checklist + Upload stacked, Decision right
- Mobile (<768px): Stacked vertical

---

### COLONNE 1 — Checklist (4/12)

Composant `checklist-column.component`:

**Affichage** : liste des documents requis par exercice fiscal

```
┌────────────────────────────┐
│ DOCUMENTS REQUIS           │
│                            │
│ Exercice 2023 [=====> 60%] │
│ ☐ Bilan                    │
│ ☐ CPC                      │
│ ☑ TFT                      │
│ ☐ Attestation Fiscale      │
│ ○ Statuts (optionnel)      │
│                            │
│ Exercice 2022 [==> 33%]    │
│ ☑ Bilan                    │
│ ☐ CPC                      │
│ ☐ TFT                      │
│ ☐ Attestation Fiscale      │
│ ○ Statuts                  │
│                            │
│ Exercice 2021 [=> 20%]     │
│ ☑ Bilan                    │
│ ☐ CPC                      │
│ ☐ TFT                      │
│ ☐ Attestation Fiscale      │
│ ○ Statuts                  │
│                            │
│ TOTAL: [========> 70%]     │
└────────────────────────────┘
```

**Logique** :

- Pour chaque exercice: afficher 5 lignes (4 requis + 1 optionnel)
- Coché si document uploadé + accepté pour cet exercice+type
- Progress bar per exercice = (requis cochés / 4) * 100
- Progress bar total = (requis cochés total / (4*3 exercices))* 100
- Couleur progress: vert si 100%, orange si 50-99%, rouge si <50%

**Requêtes API** :

- GET /api/v1/cases/{id}/documents → liste docs existants
- Mettre à jour checklist en temps réel (observable, polling 2s ou WebSocket)

---

### COLONNE 2 — Documents & Upload (5/12)

Composant `documents-column.component`:

**2 Sections** : Upload Zone + Table Existants

#### Sous-section A : Zone Upload (Drag-Drop)

```
┌──────────────────────────────────────┐
│  📁 Déposer fichiers ici (ou cliquer) │
│                                       │
│  Formats: PDF, Excel, ZIP             │
│  Taille max: 10 MB par fichier        │
│  Optionnel: sélectionner type avant   │
│  upload pour auto-détection           │
└──────────────────────────────────────┘
```

**Fonctionnalité** :

- Drag-and-drop zone (CDK dropZone)
- Click ouvre file picker (multi-select)
- Accepter: .pdf, .xlsx, .xls, .xlsm, .zip
- Rejeter: autres formats, fichiers > 10MB → toast rouge "Format ou taille invalide"
- Après sélection fichier(s): pop-up modal (DialogComponent) pour saisir métadonnées

#### Modal Upload (DocumentUploadDialog)

```
┌────────────────────────────────────────────┐
│ Uploader Document                          │
├────────────────────────────────────────────┤
│                                             │
│ Fichier: Bilan_2023.pdf [Changer]          │
│                                             │
│ Type Document*: [Sélectionner]              │
│   ☐ Bilan                                  │
│   ☐ CPC                                    │
│   ☐ TFT                                    │
│   ☐ Attestation Fiscale                    │
│   ☐ Statuts                                │
│   ☐ Autre                                  │
│                                             │
│ Exercice Fiscal*: [2023]                   │
│ (année, dropdown: 2023, 2022, 2021, ...)   │
│                                             │
│ Fiabilité*: [Sélectionner]                 │
│   ☐ Audité (Big 4 / cabinet reconnu)       │
│   ☐ Examiné (limited assurance)            │
│   ☐ Compilé (comptable, no verification)   │
│   ☐ Non-audité (auto-préparé)              │
│                                             │
│ Nom Auditeur (si Audité):                  │
│ [text input, optionnel]                     │
│                                             │
│ Notes:                                      │
│ [textarea, optionnel, max 500 chars]        │
│                                             │
│ [Annuler] [Uploader]                        │
└────────────────────────────────────────────┘
```

**Validation Modal** :

- Type document requis
- Exercice fiscal requis
- Fiabilité requise
- Auditeur requis si fiabilité = AUDITED

**POST** : POST /api/v1/cases/{id}/documents (FormData avec fichier + métadonnées)

#### Sous-section B : Table Existants

```
┌─────────────────────────────────────────────────────┐
│ DOCUMENTS TÉLÉCHARGÉS                               │
├──────┬──────────┬──────┬──────────┬────────┬────────┤
│ Doc. │ Exercice │ Taille│Fiabilité │ Statut │Action  │
├──────┼──────────┼──────┼──────────┼────────┼────────┤
│Bilan │ 2023     │ 2.3MB│ Audité   │ ✓ OK   │[...] ⌫ │
│CPC   │ 2023     │ 1.8MB│ Compilé  │⚠ WARN │[...] ⌫ │
│TFT   │ 2023     │ 1.2MB│ Non-A    │ ✗ KO   │[...] ⌫ │
│Bilan │ 2022     │ 2.1MB│ Audité   │ ✓ OK   │[...] ⌫ │
└──────┴──────────┴──────┴──────────┴────────┴────────┘
```

**Colonnes** :

- Document: type (Bilan, CPC, TFT, Attestation, Statuts)
- Exercice: année (2023, 2022, 2021)
- Taille: format human-readable (2.3 MB)
- Fiabilité: enum label
- Statut:
  - ✓ OK (vert) : fichier accepté, no issues
  - ⚠️ WARN (orange): fichier accepted mais flag warning (ex: date suspecte)
  - ✗ KO (rouge): fichier rejeté (format, intégrité, ou autre)
- Actions:
  - [...] Menu: [Voir Détails] [Remplacer] [Télécharger]
  - ⌫ Bouton Supprimer (DELETE)

**Table Material** :

- MatTableDataSource avec paginator (5 rows par page)
- Triable par: Document, Exercice, Statut
- Hover effects

**Menu Contextuel [...]**:

- [Voir Détails]: affiche modal READ-ONLY avec:
  - Métadonnées: type, exercice, fiabilité, auditeur, notes
  - Intégrité: hash fichier, date upload, uploaded by
  - Red flags (si présentes): liste détaillée
- [Remplacer]: permet re-upload du même fichier
- [Télécharger]: GET /api/v1/cases/{id}/documents/{doc_id} → download

**Suppression** :

- Bouton ⌫: confirmation modale "Supprimer ce document?"
- Si OK: DELETE /api/v1/cases/{id}/documents/{doc_id}
- Checklist se met à jour (observable)

---

### COLONNE 3 — Decision (3/12)

Composant `decision-column.component`:

**Affichage initial** (avant évaluation):

```
┌────────────────────────────────┐
│ DÉCISION GATE                  │
│                                │
│ [Lancer Évaluation Gate]       │
│                                │
│ Note: Évaluation automatique   │
│ des documents uploadés.        │
│                                │
│ État: EN ATTENTE               │
│ Pas encore évalué.             │
└────────────────────────────────┘
```

**Bouton [Lancer Évaluation Gate]**:

- POST /api/v1/cases/{id}/gate/evaluate
- Spinner loading pendant traitement (2-5s)
- Affiche résultat ci-dessous une fois reçu

**Affichage après évaluation** (is_passed=true):

```
┌────────────────────────────────┐
│ DÉCISION GATE ✓ PASSÉ          │
│                                │
│ Verdict: PASSÉ                 │
│ Fiabilité: HIGH (92/100)       │
│ Niveau: ÉLEVÉ                  │
│                                │
│ Documents complètement reçus:  │
│ ☑ Bilans (3 ex.)              │
│ ☑ CPCs (3 ex.)                │
│ ☑ TFTs (3 ex.)                │
│ ☑ Attestations (3 ex.)        │
│ ○ Statuts (2/3)               │
│                                │
│ Pas de raisons bloquantes.     │
│                                │
│ 🔓 Financials déverrouillés    │
│                                │
│ [Sceller le Gate] →            │
│ [Aller aux Financials]         │
└────────────────────────────────┘
```

**Affichage après évaluation** (is_passed=false):

```
┌────────────────────────────────┐
│ DÉCISION GATE ✗ BLOQUÉ         │
│                                │
│ Verdict: BLOQUÉ                │
│ Fiabilité: LOW (34/100)        │
│ Niveau: CRITIQUE               │
│                                │
│ ❌ RAISONS BLOQUANTES:          │
│ • Bilan 2023 manquant          │
│ • CPC 2023 intégrité KO        │
│ • TFT 2022 non-reçu            │
│                                │
│ ⚠️ RÉSERVES (non-bloquant):     │
│ • Statuts 2023 absent          │
│ • Date signature suspecte 2022 │
│                                │
│ 🔒 Financials verrouillés      │
│                                │
│ Actions:                        │
│ [Corriger Documents]            │
│ [Retour Upload]                │
└────────────────────────────────┘
```

**Buttons POST VERDICT** :

Si PASSÉ:

- `[Sceller le Gate]` (mat-raised-button, color="primary")
  - PATCH /api/v1/cases/{id} status=FINANCIAL_INPUT
  - Success: Toast vert "Gate scellé. Financials déverrouillés."
  - Redirection optionnelle: `/cases/{id}/financials`
- `[Aller aux Financials]` (mat-button, color="accent")
  - Navigue `/cases/{id}/financials`

Si BLOQUÉ:

- `[Corriger Documents]` (mat-raised-button, color="warn")
  - Scroll to Col 2 (documents)
  - Focus zone upload
- `[Retour Dashboard]` (mat-button)
  - Navigue `/dashboard`

---

### Red Flags & Audit Log

**Red Flags Display** (si présentes dans réponse gate/evaluate):

Au-dessus de la décision (banner rouge/orange):

```
⚠️ FLAGS DÉTECTÉS:
• Fichier CPC_2023.xlsx : Intégrité suspecte (checksum ne correspond pas)
• Dates de signature : 15/03/2025 > date actuelle (erreur saisie?)
• Conflits de données : Total Bilan CPC vs Bilan doc différent de 5%
```

**Audit Log** (section foldable en bas):

```
[v] AUDIT LOG

2026-03-16 16:42:15 UTC | admin@finaces.local | Évaluation gate lancée
2026-03-16 16:42:20 UTC | SYSTEM | Documents analysés (5 fichiers)
2026-03-16 16:42:25 UTC | SYSTEM | Intégrité fichiers: OK
2026-03-16 16:42:30 UTC | SYSTEM | Red flags détectés: 3
2026-03-16 16:42:35 UTC | SYSTEM | Décision: BLOQUÉ
```

---

## CONTRAINTES ANGULAR

### Standalone Components

```typescript
@Component({
  selector: 'app-gate',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatTableModule, MatButtonModule,
    MatDialogModule, MatProgressBarModule, MatIconModule,
    MatTooltipModule, MatMenuModule, MatBadgeModule,
    DragDropModule, // CDK
    ChecklistColumnComponent, DocumentsColumnComponent,
    DecisionColumnComponent
  ],
  templateUrl: './gate.component.html',
  styleUrl: './gate.component.scss'
})
export class GateComponent implements OnInit, OnDestroy {
  // ...
}
```

### Services & Dependency Injection

```typescript
constructor(
  private caseService: CaseService,
  private documentService: DocumentService,
  private dialog: MatDialog,
  private router: Router,
  private route: ActivatedRoute
) {}
```

### Observable Pattern

Utiliser RxJS pour gestion état:

```typescript
case$: Observable<EvaluationCaseDetailOut>;
documents$: Observable<DocumentOut[]>;
gateDecision$: Observable<GateDecisionSchema>;

ngOnInit(): void {
  const caseId = this.route.snapshot.paramMap.get('caseId');

  this.case$ = this.caseService.getCase(caseId);

  this.documents$ = this.caseService.getDocuments(caseId)
    .pipe(shareReplay(1)); // cache

  // Polling ou auto-update après upload
  this.setupDocumentPolling(caseId);
}

private setupDocumentPolling(caseId: string): void {
  // Poll documents toutes les 2 secondes si file pending
  interval(2000).pipe(
    switchMap(() => this.caseService.getDocuments(caseId)),
    takeUntil(this.destroy$)
  ).subscribe(docs => {
    this.updateChecklistProgress(docs);
  });
}
```

### Change Detection

Strategy OnPush partout:

```typescript
changeDetection: ChangeDetectionStrategy.OnPush
```

---

## BINDING API

### 1. POST /api/v1/cases/{id}/documents (Upload)

**Request: FormData**

```
Content-Type: multipart/form-data

file: [binary file]
document_type: "BILAN"
fiscal_year: 2023
reliability_level: "AUDITED"
auditor_name: "PwC"
notes: "Audit annuel 2023"
```

**Response: DocumentOut**

```json
{
  "id": "uuid-doc",
  "case_id": "uuid-case",
  "filename": "Bilan_2023.pdf",
  "original_filename": "Bilan_2023.pdf",
  "file_size": 2400000,
  "file_hash": "sha256:...",
  "document_type": "BILAN",
  "fiscal_year": 2023,
  "reliability_level": "AUDITED",
  "auditor_name": "PwC",
  "notes": "Audit annuel 2023",
  "upload_status": "UPLOADED",
  "integrity_status": "OK",
  "processing_status": "COMPLETED",
  "red_flags": [],
  "uploaded_at": "2026-03-16T16:42:00Z",
  "processed_at": "2026-03-16T16:42:15Z",
  "created_by": "admin@finaces.local"
}
```

### 2. GET /api/v1/cases/{id}/documents

**Response: DocumentOut[]**

```json
{
  "documents": [
    {
      "id": "uuid-1",
      "filename": "Bilan_2023.pdf",
      "document_type": "BILAN",
      "fiscal_year": 2023,
      "file_size": 2400000,
      "reliability_level": "AUDITED",
      "integrity_status": "OK",
      "red_flags": [],
      "uploaded_at": "2026-03-16T16:42:00Z"
    },
    { ... }
  ],
  "total": 5
}
```

### 3. GET /api/v1/cases/{id}/documents/{doc_id}/integrity

**Response**:

```json
{
  "document_id": "uuid-doc",
  "file_hash": "sha256:abc123...",
  "integrity_check": "OK",
  "file_size": 2400000,
  "last_accessed": "2026-03-16T16:45:00Z",
  "red_flags": []
}
```

### 4. DELETE /api/v1/cases/{id}/documents/{doc_id}

**Response: 204 No Content**

### 5. POST /api/v1/cases/{id}/gate/evaluate

**Response: GateDecisionSchema**

```json
{
  "id": "uuid-gate-eval",
  "case_id": "uuid-case",
  "is_passed": true,
  "verdict": "PASSÉ",
  "reliability_score": 92,
  "reliability_level": "HIGH",
  "blocking_reasons": [],
  "reserve_flags": [],
  "missing_docs": [],
  "documents_received": {
    "BILAN": [2023, 2022, 2021],
    "CPC": [2023, 2022, 2021],
    "TFT": [2023, 2022, 2021],
    "ATTESTATION_FISCALE": [2023, 2022, 2021],
    "STATUTS": [2023, 2022]
  },
  "audit_log": [
    {
      "timestamp": "2026-03-16T16:42:15Z",
      "actor": "SYSTEM",
      "action": "Documents analysés",
      "details": "5 fichiers reçus"
    }
  ],
  "evaluated_at": "2026-03-16T16:42:35Z",
  "evaluated_by": "SYSTEM"
}
```

### 6. PATCH /api/v1/cases/{id} (Sceller Gate)

**Request**:

```json
{
  "status": "FINANCIAL_INPUT"
}
```

**Response: EvaluationCaseDetailOut** (status = FINANCIAL_INPUT)

### 7. Service Methods to Add/Extend

```typescript
// document.service.ts (nouveau)

uploadDocument(caseId: string, formData: FormData): Observable<DocumentOut> {
  return this.http.post<DocumentOut>(
    `${this.apiUrl}/cases/${caseId}/documents`,
    formData
  );
}

getDocuments(caseId: string): Observable<DocumentOut[]> {
  return this.http.get<DocumentOut[]>(
    `${this.apiUrl}/cases/${caseId}/documents`
  );
}

getDocumentIntegrity(caseId: string, docId: string): Observable<any> {
  return this.http.get<any>(
    `${this.apiUrl}/cases/${caseId}/documents/${docId}/integrity`
  );
}

deleteDocument(caseId: string, docId: string): Observable<void> {
  return this.http.delete<void>(
    `${this.apiUrl}/cases/${caseId}/documents/${docId}`
  );
}

// case.service.ts (extension)

evaluateGate(caseId: string): Observable<GateDecisionSchema> {
  return this.http.post<GateDecisionSchema>(
    `${this.apiUrl}/cases/${caseId}/gate/evaluate`,
    {}
  );
}

patchCaseStatus(caseId: string, status: string): Observable<EvaluationCaseDetailOut> {
  return this.http.patch<EvaluationCaseDetailOut>(
    `${this.apiUrl}/cases/${caseId}`,
    { status }
  );
}
```

---

## CRITÈRES DE VALIDATION

### Fonctionnel

- [ ] Route `/cases/{id}/gate` charge dossier et documents
- [ ] Checklist affiche exercices requis + progress bars
- [ ] Checklist se met à jour en temps réel après upload (polling ou WebSocket)
- [ ] Drag-drop zone accepte PDF/Excel/ZIP, rejette autres formats
- [ ] Modal upload apparaît après sélection fichier
- [ ] Modal valide: type + exercice + fiabilité requis
- [ ] Upload POST requête envoie FormData + métadonnées
- [ ] Table documents affiche tous fichiers uploadés
- [ ] Table tris par: Document, Exercice, Statut
- [ ] Menu [...] sur row: [Voir Détails] [Remplacer] [Télécharger]
- [ ] Bouton ⌫ supprime doc après confirmation
- [ ] [Lancer Évaluation Gate] déclenche POST gate/evaluate
- [ ] Spinner affiche pendant traitement (2-5s)
- [ ] Résultat PASSÉ affiche:
  - [ ] Verdict vert ✓ PASSÉ
  - [ ] Fiabilité score + level
  - [ ] Documents complètement reçus
  - [ ] Boutons [Sceller Gate] et [Aller aux Financials]
- [ ] Résultat BLOQUÉ affiche:
  - [ ] Verdict rouge ✗ BLOQUÉ
  - [ ] Raisons bloquantes (liste)
  - [ ] Réserves non-bloquantes (liste)
  - [ ] Boutons [Corriger] et [Retour Dashboard]
- [ ] [Sceller Gate] PATCH status FINANCIAL_INPUT
- [ ] Post-scellement: "Gate scellé. Financials déverrouillés."
- [ ] Red flags affichés en banner si présents

### Visuel & UX

- [ ] Layout 3 colonnes responsive
- [ ] Progress bars couleur: vert 100%, orange 50-99%, rouge <50%
- [ ] Icônes Material corrects (folder_open, warning, check_circle, etc.)
- [ ] Statut badges: ✓ OK vert, ⚠️ WARN orange, ✗ KO rouge
- [ ] Spacing/padding cohérent
- [ ] Topbar contextuelle affiche ref dossier + progn
- [ ] Empty states clairs

### Performance

- [ ] Upload < 30s pour fichier 10MB
- [ ] Tableau < 100ms rendu initial
- [ ] Polling documents: 2s interval, pas de jank

### Accessibilité

- [ ] Drag-drop zone ARIA-labelledby
- [ ] Boutons ARIA-disabled si bloqués
- [ ] Erreurs validation ARIA-live
- [ ] Contraste couleurs >= 4.5:1

---

## FICHIERS LIVRÉS À LA FIN DE CE PROMPT

1. `src/app/pages/gate/gate.component.ts`
2. `src/app/pages/gate/gate.component.html`
3. `src/app/pages/gate/gate.component.scss`
4. `src/app/pages/gate/components/checklist-column.component.ts`
5. `src/app/pages/gate/components/checklist-column.component.html`
6. `src/app/pages/gate/components/checklist-column.component.scss`
7. `src/app/pages/gate/components/documents-column.component.ts`
8. `src/app/pages/gate/components/documents-column.component.html`
9. `src/app/pages/gate/components/documents-column.component.scss`
10. `src/app/pages/gate/components/decision-column.component.ts`
11. `src/app/pages/gate/components/decision-column.component.html`
12. `src/app/pages/gate/components/decision-column.component.scss`
13. `src/app/pages/gate/components/document-upload-dialog.component.ts`
14. `src/app/pages/gate/components/document-upload-dialog.component.html`
15. `src/app/pages/gate/components/document-upload-dialog.component.scss`
16. `src/app/app.routes.ts` — modifié (route `/cases/:caseId/gate`)
17. `src/app/services/document.service.ts` — créé
18. `src/app/services/case.service.ts` — modifié (evaluateGate, patchCaseStatus)
19. `src/app/models/gate.model.ts` — créé

---

## NOTES TECHNIQUES

- Drag-drop: CDK (@angular/cdk/drag-drop)
- File picker: HTML5 input[type=file] + CDK dropzone
- Polling: RxJS interval() + switchMap + takeUntil
- FormData: new FormData() + append() pour upload multipart
- Spinner: mat-spinner ou custom loading component
- Dialog: MatDialog pour modal upload
- Checksum: backend calcule SHA256, frontend affiche pour traçabilité
- Timezones: tous UTC, afficher en locale user

---

**FIN P8 — BLOC 1B — Gate Documentaire**
