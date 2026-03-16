═══════════════════════════════════════════════════════════
PROMPT 7 — BLOC 1A — Recevabilité & Création de Dossier (Stepper + CaseCreate)
Dépend de : PROMPT 6 (Dashboard)
Peut être parallélisé avec : Aucun
═══════════════════════════════════════════════════════════

## CONTEXTE

Le formulaire de création de dossier (Case) est l'étape d'**entrée de données initiales** avant toute évaluation. Il précède obligatoirement le Gate documentaire (P8).

Ce formulaire guide l'utilisateur à travers 4 étapes logiques (stepper horizontal):
1. **Informations Marché** : paramètres du contrat (type, référence, montant, durée, pays, secteur)
2. **Soumissionnaire** : identification du bidder (recherche existant ou création nouveau)
3. **Récapitulatif** : relecture des données saisies avec possibilité de modifier
4. **Confirmation** : envoi effectif des données vers le backend (status PENDING_GATE)

Parallèlement, un bouton **[Enregistrer brouillon]** est disponible à chaque étape pour sauvegarder un état intermédiaire (status DRAFT). Cela permet à l'utilisateur de reprendre plus tard.

Le contexte métier:
- **SINGLE** : un seul soumissionnaire
- **GROUPEMENT** : groupement solidaire d'entreprises (2+ membres)
- **LOTS** : appel d'offres segmenté (chaque lot = un dossier distinct)

Les sensibilités sectorielles, pays à risque, et montants élevés peuvent déclencher des flags de "sensitive" pour révisions spécialisées.

---

## RÈGLES MÉTIER APPLICABLES

**MCC-R1** : MCC est source unique. Le formulaire ne capture que les données brutes (pas de scores MCC/IA ici).

**Status Machine** :
- Au clic [Enregistrer brouillon]: status = DRAFT, sauvegarde partielle possible
- À l'étape 4 [Confirmation] → [Créer dossier]: POST case → status = PENDING_GATE (premier état non-DRAFT, déclenche workflow)
- DRAFT ne bloque pas modification (session persistante, pas de verrou)
- PENDING_GATE verrouille édition jusqu'à completion du Gate (P8)

**Données Requises (step 1)**:
- `case_type`: enum {SINGLE, GROUPEMENT, LOTS} — requis
- `market_reference`: string (ex: "MCC-2024-001") — requis, unique
- `market_label`: string (ex: "Fourniture matériel IT pour Ministère Transport") — requis
- `contract_value`: number > 0 — requis
- `contract_currency`: enum {USD, EUR, MAD, ...} — requis
- `contract_duration_months`: number > 0 — requis
- `country`: enum ou string (pays ISO alpha-3, ex: "MAR") — requis
- `sector`: enum {IT, BTP, Energy, Manufacturing, Services, Other} — requis
- `sensitive`: boolean (flag pour marchés sensibles) — optionnel, défaut false
- `notes`: text (max 500 chars) — optionnel

**Données Requises (step 2)**:
- Si choix "Soumissionnaire existant": `bidder_id` — requis
- Si choix "Créer nouveau":
  - `bidder_name`: string — requis
  - `legal_form`: enum {SARL, SA, SNC, EI, Other} — requis
  - `registration_number`: string — optionnel (numéro immatriculation RCS)
  - `email`: email — optionnel
  - `phone`: phone — optionnel

**Groupement (si case_type = GROUPEMENT)**:
- `members`: array de {name, role (LEADER/MEMBER), participation_percentage}
- Au moins 2 membres, total participation = 100%
- 1 leader obligatoire
- Participation > 0 pour chaque membre

---

## FICHIERS À CRÉER / MODIFIER

### Création :
1. `src/app/pages/case-create/case-create.component.ts`
2. `src/app/pages/case-create/case-create.component.html`
3. `src/app/pages/case-create/case-create.component.scss`
4. `src/app/pages/case-create/steps/step1-market-info.component.ts`
5. `src/app/pages/case-create/steps/step1-market-info.component.html`
6. `src/app/pages/case-create/steps/step1-market-info.component.scss`
7. `src/app/pages/case-create/steps/step2-bidder.component.ts`
8. `src/app/pages/case-create/steps/step2-bidder.component.html`
9. `src/app/pages/case-create/steps/step2-bidder.component.scss`
10. `src/app/pages/case-create/steps/step3-summary.component.ts`
11. `src/app/pages/case-create/steps/step3-summary.component.html`
12. `src/app/pages/case-create/steps/step3-summary.component.scss`
13. `src/app/pages/case-create/steps/step4-confirmation.component.ts`
14. `src/app/pages/case-create/steps/step4-confirmation.component.html`
15. `src/app/pages/case-create/steps/step4-confirmation.component.scss`
16. `src/app/pages/case-create/components/groupement-members.component.ts` (si GROUPEMENT)
17. `src/app/pages/case-create/components/groupement-members.component.html`

### Modification :
1. `src/app/app.routes.ts` : ajouter route `/cases/new`
2. `src/app/services/case.service.ts` : ajouter `createCase(data)` et `saveDraft(data)`
3. `src/app/services/bidder.service.ts` : créer (si non-existant) avec `searchBidders(query)` et `createBidder(data)`
4. `src/app/models/case.model.ts` : ajouter `CaseCreateSchema`, `CaseUpdateSchema`
5. `src/app/models/bidder.model.ts` : créer ou étendre avec `BidderSearchOut`, `BidderCreateSchema`

---

## SPÉCIFICATION TECHNIQUE COMPLÈTE

### Route et Navigation
- **Route** : `/cases/new`
- **Breadcrumb** : "Dossiers / Nouveau Dossier"
- **Page Title** : "Créer un Nouveau Dossier"

### Layout Stepper Principal

```
┌───────────────────────────────────────────────────────┐
│ Créer un Nouveau Dossier                              │
├───────────────────────────────────────────────────────┤
│                                                         │
│ [1. Marché] → [2. Bidder] → [3. Récap] → [4. Confirme]│
│ (active)                                                │
│                                                         │
├───────────────────────────────────────────────────────┤
│                                                         │
│  Contenu Step Actuel (formulaire ou contenu)          │
│                                                         │
│  [Enregistrer brouillon] [Suivant]                    │
│                                                         │
└───────────────────────────────────────────────────────┘
```

**Mat-Stepper Attributs** :
- `linear = true` : validation étape N avant passage étape N+1
- Orientation: `horizontal` (desktop) / `vertical` (mobile si screenSize < 768px via @media)
- Icônes steps: 1, 2, 3, 4 (number)

---

### STEP 1 — Informations Marché

Composant `step1-market-info.component`:

**FormGroup : marketForm**

| Champ | Type | Validation | Notes |
|-------|------|-----------|-------|
| `case_type` | radio (SINGLE\|GROUPEMENT\|LOTS) | requis | affiche/cache section groupement |
| `market_reference` | text | requis, pattern ^[A-Z]{3}-\d{4}-\d{3}$ | ex: MCC-2024-001 |
| `market_label` | text | requis, max 200 | description du marché |
| `contract_value` | number | requis, > 0, max 1e12 | currency validation |
| `contract_currency` | select | requis | USD, EUR, MAD, GBP, ... |
| `contract_duration_months` | number | requis, > 0, < 240 | durée contrat |
| `country` | select (search) | requis | liste complète pays ISO-3 |
| `sector` | select | requis | IT, BTP, Energy, Manufacturing, Services, Other |
| `sensitive` | checkbox | optionnel, défaut false | "Marché sensible/stratégique" |
| `notes` | textarea | optionnel, max 500 | commentaires libres |

**Layout HTML** :
- 2 colonnes (col-md-6) sur desktop, 1 colonne mobile
- case_type: radio buttons horizontaux avec icônes (SINGLE: person, GROUPEMENT: people, LOTS: folder_multiple)
- market_reference, market_label: champs texte simples
- contract_value + currency: row avec input number + select currency côte à côte
- contract_duration_months: input number avec label "mois"
- country: mat-select avec mat-optgroup (continents) et mat-option filterable (mat-autocomplete)
- sector: mat-select simple
- sensitive: mat-checkbox avec tooltip "Ex: secteur défense, marché géopolitiquement sensible"
- notes: textarea (mat-form-field avec mat-textarea-autosize)

**Validation Errors Affichage** :
- Sous chaque champ invalide: message d'erreur rouge (mat-error)
- Required: "Ce champ est obligatoire"
- Pattern market_reference: "Format: XXX-YYYY-ZZZ (ex: MCC-2024-001)"
- Min/Max contract_value: "Montant entre 0 et 1 trillion"
- Caractères invalides: "Caractères non-autorisés"

**Groupement Section** (affiché si case_type = GROUPEMENT):
- Composant imbriqué `groupement-members.component`
- Tableau: Nom | Rôle (LEADER/MEMBER) | Participation (%) | Actions
- Bouton [+ Ajouter Membre]
- Validation: minimum 2, total = 100%, 1 LEADER

---

### STEP 2 — Soumissionnaire

Composant `step2-bidder.component`:

**Deux modes** : Radio buttons en haut
- [O] Soumissionnaire existant
- [O] Créer nouveau soumissionnaire

**Mode "Existant"** :
- Mat-autocomplete input: "Rechercher soumissionnaire"
- À chaque keystroke: GET `/api/v1/cases/bidders?search={query}`
- Options affichées: Logo (avatar 2L) + Nom + Pays + Secteur prédominant
- Sélection: remplit formGroup avec bidder_id

**Mode "Nouveau"** :
- FormGroup : bidderForm
- Champs:
  - `bidder_name`: text, requis, max 100
  - `legal_form`: select {SARL, SA, SNC, EI, Other}, requis
  - `registration_number`: text, optionnel, max 20 (RCS/SIRET/etc.)
  - `email`: email, optionnel
  - `phone`: phone, optionnel

**Layout** :
- Toggle: radio buttons en haut (Material style)
- Mode existant: autocomplete + display bidder details (logo, forme juridique, pays, email)
- Mode nouveau: formulaire compact (2 col desktop, 1 col mobile)

**Validation** :
- bidder_name: required
- legal_form: required
- email: format email si fourni
- phone: format international si fourni
- Détection dupli: avant POST, vérifier GET `/api/v1/cases/bidders?name={name}` pour éviter doubles créations

---

### STEP 3 — Récapitulatif

Composant `step3-summary.component`:

**Affichage READ-ONLY** de toutes les données saisies aux steps 1-2:

```
╔════════════════════════════════════════════════════════════╗
║ INFORMATIONS MARCHÉ                        [Modifier]      ║
├────────────────────────────────────────────────────────────┤
║ Type de Dossier: SINGLE                                    ║
║ Référence: MCC-2024-001                                    ║
║ Label: Fourniture IT Ministère Transport                   ║
║ Montant: USD 2,500,000.00                                  ║
║ Durée: 24 mois                                             ║
║ Pays: Maroc                                                ║
║ Secteur: IT                                                ║
║ Sensibilité: Oui                                           ║
║ Notes: Contexte géopolitique sensible...                  ║
╚════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════╗
║ SOUMISSIONNAIRE                            [Modifier]      ║
├────────────────────────────────────────────────────────────┤
║ Nom: Société XYZ SARL                                      ║
║ Forme: SARL                                                ║
║ RCS: 12345678                                              ║
║ Email: contact@xyz.ma                                      ║
║ Téléphone: +212 612 345 678                                ║
╚════════════════════════════════════════════════════════════╝

(Si GROUPEMENT):
╔════════════════════════════════════════════════════════════╗
║ MEMBRES GROUPEMENT                         [Modifier]      ║
├────────────────────────────────────────────────────────────┤
║ Société A (LEADER, 50%)                                    ║
║ Société B (MEMBER, 30%)                                    ║
║ Société C (MEMBER, 20%)                                    ║
╚════════════════════════════════════════════════════════════╝
```

**Bouton [Modifier]** sur chaque section → retourne à step correspondante (via stepper.selectedIndex)

---

### STEP 4 — Confirmation

Composant `step4-confirmation.component`:

**Affichage final** identique à step 3 (READ-ONLY).

**Boutons d'action** :
1. Bouton `[Créer Dossier]` (mat-raised-button, color="primary")
   - Déclenche: POST /api/v1/cases (CaseCreateSchema)
   - En cas succès:
     - Notification toast "Dossier créé avec succès"
     - Redirection vers `/cases/{new_case_id}` (case créé retourné)
   - En cas erreur:
     - Toast rouge: "Erreur création dossier: {message}"
     - Reste sur step 4

2. Bouton `[Retour Dashboard]` (mat-button, color="accent")
   - Navigue vers `/dashboard`

3. Lien `[Annuler]` (mat-button plain)
   - Demande confirmation "Les données non sauvegardées seront perdues"
   - Si confirmé: navigue `/dashboard` (sans sauvegarder)

**Spinner/Loading State** :
- Pendant POST: désactiver tous les boutons, afficher spinner
- Message: "Création du dossier en cours..."

---

### "Enregistrer Brouillon" (Disponible Step 1-3)

Bouton présent en bas à gauche de chaque step (sauf step 4):
- `[Enregistrer Brouillon]` (mat-stroked-button)
- Action:
  - Collecte données step actuelle + data déjà saisie aux steps précédentes
  - POST /api/v1/cases (CaseCreateSchema avec status = "DRAFT")
  - En cas succès:
    - Toast vert: "Brouillon sauvegardé"
    - Optionnel: redirection vers `/cases/{id}` (affiche "Mode brouillon, continuer édition?")
  - En cas erreur: Toast rouge avec message
- **Important** : brouillon reste en DRAFT, n'entame pas workflow PENDING_GATE

---

## CONTRAINTES ANGULAR

### Standalone Components
Tous les composants case-create standalone:

```typescript
@Component({
  selector: 'app-case-create',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    MatStepperModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule,
    MatAutocompleteModule, MatCheckboxModule, MatRadioModule,
    MatTooltipModule, MatCardModule,
    // custom imports:
    GroupementMembersComponent, RiskBadgeComponent // P4
  ],
  templateUrl: './case-create.component.html',
  styleUrl: './case-create.component.scss'
})
export class CaseCreateComponent implements OnInit {
  // ...
}
```

### Form Architecture

Utiliser **Reactive Forms** (FormBuilder):

```typescript
export class Step1Component implements OnInit {
  marketForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.marketForm = this.fb.group({
      case_type: ['', [Validators.required]],
      market_reference: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}-\d{4}-\d{3}$/)]],
      market_label: ['', [Validators.required, Validators.maxLength(200)]],
      contract_value: [null, [Validators.required, Validators.min(1)]],
      contract_currency: ['USD', [Validators.required]],
      contract_duration_months: [null, [Validators.required, Validators.min(1), Validators.max(240)]],
      country: ['', [Validators.required]],
      sector: ['', [Validators.required]],
      sensitive: [false],
      notes: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    // listener sur case_type pour afficher/masquer groupement
    this.marketForm.get('case_type').valueChanges
      .subscribe(type => this.onCaseTypeChange(type));
  }
}
```

### State Management (via Service)

Composant parent case-create doit **persister** les données au fur et à mesure:

```typescript
export class CaseCreateComponent {
  private formDataSubject = new BehaviorSubject<any>({});
  formData$ = this.formDataSubject.asObservable();

  onStepChange(step: number, data: any) {
    this.formDataSubject.next({
      ...this.formDataSubject.value,
      ...data
    });
  }

  saveAndProceedToNextStep() {
    // optionnel: POST brouillon
  }
}
```

### Change Detection

Strategy OnPush sur tous les composants:

```typescript
changeDetection: ChangeDetectionStrategy.OnPush
```

---

## BINDING API

### 1. POST /api/v1/cases (Create Case)

**Request: CaseCreateSchema**
```json
{
  "case_type": "SINGLE",
  "market_reference": "MCC-2024-001",
  "market_label": "Fourniture IT Ministère",
  "contract_value": 2500000,
  "contract_currency": "USD",
  "contract_duration_months": 24,
  "country": "MAR",
  "sector": "IT",
  "sensitive": false,
  "notes": "Optionnel",
  "bidder_id": "uuid-if-existing-or-null",
  "bidder_name": "Société XYZ (if new)",
  "legal_form": "SARL",
  "registration_number": "12345678",
  "email": "contact@xyz.ma",
  "phone": "+212612345678",
  "members": [
    {
      "name": "Société A",
      "role": "LEADER",
      "participation_percentage": 50
    }
  ],
  "status": "PENDING_GATE" // ou DRAFT si [Enregistrer brouillon]
}
```

**Response: EvaluationCaseDetailOut**
```json
{
  "id": "uuid-generated",
  "reference": "MCC-2024-001",
  "case_type": "SINGLE",
  "market_label": "Fourniture IT Ministère",
  "contract_value": 2500000,
  "contract_currency": "USD",
  "contract_duration_months": 24,
  "country": "MAR",
  "sector": "IT",
  "sensitive": false,
  "bidder": {
    "id": "uuid-bidder",
    "name": "Société XYZ SARL",
    "country": "MAR"
  },
  "status": "PENDING_GATE",
  "created_at": "2026-03-16T10:30:00Z",
  "updated_at": "2026-03-16T10:30:00Z"
}
```

### 2. GET /api/v1/cases/bidders?search={query}

**Response: BidderSearchOut[]**
```json
{
  "bidders": [
    {
      "id": "uuid",
      "name": "Société ABC SARL",
      "country": "MAR",
      "primary_sector": "IT",
      "email": "contact@abc.ma"
    },
    { ... }
  ]
}
```

### 3. Service Methods to Add

```typescript
// case.service.ts

createCase(data: CaseCreateSchema): Observable<EvaluationCaseDetailOut> {
  return this.http.post<EvaluationCaseDetailOut>(
    `${this.apiUrl}/cases`,
    data
  );
}

saveCaseDraft(data: CaseCreateSchema): Observable<EvaluationCaseDetailOut> {
  // POST with status=DRAFT
  return this.createCase({ ...data, status: 'DRAFT' });
}

// bidder.service.ts (nouveau fichier)

searchBidders(query: string): Observable<BidderSearchOut[]> {
  return this.http.get<BidderSearchOut[]>(
    `${this.apiUrl}/cases/bidders?search=${encodeURIComponent(query)}`
  );
}

createBidder(data: BidderCreateSchema): Observable<BidderOut> {
  return this.http.post<BidderOut>(
    `${this.apiUrl}/bidders`,
    data
  );
}
```

---

## CRITÈRES DE VALIDATION

### Fonctionnel

- [ ] Route `/cases/new` affiche stepper 4 steps
- [ ] Stepper linear: validation before next step
- [ ] Step 1 validation: case_type + market_reference + montant + pays requis
- [ ] Step 2 validation: bidder_id OR (bidder_name + legal_form) requis
- [ ] Groupement mode: affiche/cache selon case_type
- [ ] Step 3 affiche recap lisible, [Modifier] retourne aux steps
- [ ] [Créer Dossier] POST /api/v1/cases avec status=PENDING_GATE
- [ ] Succès: toast + redirect `/cases/{id}`
- [ ] Erreur: toast rouge, reste sur page
- [ ] [Enregistrer brouillon] POST avec status=DRAFT (tous steps sauf 4)
- [ ] [Retour Dashboard] navigue `/dashboard` sans sauvegarder (après confirmation)
- [ ] Autocomplete bidders: appel API à chaque keystroke
- [ ] Duplication bidders: warning si bidder_name déjà existe

### Visuel & UX

- [ ] Stepper horizontal (mobile: responsive vertical)
- [ ] Icônes steps claires (1, 2, 3, 4)
- [ ] Erreurs validation affichées sous champs
- [ ] Focus/outline contraste suffisant
- [ ] Currency symbol côte à côte à value input
- [ ] Groupement section: UI claire avec add/remove
- [ ] Buttons cohérents (Primary pour actions, Stroked pour brouillon)
- [ ] Spinner loading pendant POST

### Performance

- [ ] Debounce autocomplete (300ms)
- [ ] API calls optimisés (pas de double-call)
- [ ] Form state persists lors navigation steps (BehaviorSubject)

### Accessibilité

- [ ] Labels explicites sur tous les inputs
- [ ] ARIA-required sur champs obligatoires
- [ ] Error messages ARIA-live
- [ ] Tab order logique (step par step)

---

## FICHIERS LIVRÉS À LA FIN DE CE PROMPT

1. `src/app/pages/case-create/case-create.component.ts`
2. `src/app/pages/case-create/case-create.component.html`
3. `src/app/pages/case-create/case-create.component.scss`
4. `src/app/pages/case-create/steps/step1-market-info.component.ts`
5. `src/app/pages/case-create/steps/step1-market-info.component.html`
6. `src/app/pages/case-create/steps/step1-market-info.component.scss`
7. `src/app/pages/case-create/steps/step2-bidder.component.ts`
8. `src/app/pages/case-create/steps/step2-bidder.component.html`
9. `src/app/pages/case-create/steps/step2-bidder.component.scss`
10. `src/app/pages/case-create/steps/step3-summary.component.ts`
11. `src/app/pages/case-create/steps/step3-summary.component.html`
12. `src/app/pages/case-create/steps/step3-summary.component.scss`
13. `src/app/pages/case-create/steps/step4-confirmation.component.ts`
14. `src/app/pages/case-create/steps/step4-confirmation.component.html`
15. `src/app/pages/case-create/steps/step4-confirmation.component.scss`
16. `src/app/pages/case-create/components/groupement-members.component.ts`
17. `src/app/pages/case-create/components/groupement-members.component.html`
18. `src/app/pages/case-create/components/groupement-members.component.scss`
19. `src/app/app.routes.ts` — modifié (ajout route `/cases/new`)
20. `src/app/services/case.service.ts` — modifié (createCase, saveCaseDraft)
21. `src/app/services/bidder.service.ts` — créé (searchBidders, createBidder)
22. `src/app/models/case.model.ts` — modifié (CaseCreateSchema)
23. `src/app/models/bidder.model.ts` — créé ou étendu

---

## NOTES TECHNIQUES

- Pattern market_reference: `^[A-Z]{3}-\d{4}-\d{3}$` (ex: MCC-2024-001)
- Currency: dropdown ou free input? **Dropdown recommandé** (standardisation)
- Pays: utiliser liste complète ISO-3 (ex: MAR, FRA, GBR, USA) avec traduction en français
- Secteurs: enum limité (IT, BTP, Energy, Manufacturing, Services, Other)
- Async validation: market_reference doit être unique → custom AsyncValidator
- Groupement: minimum 2 members, max 10, total = 100%
- Toast notifications: MatSnackBar (success vert, error rouge, info bleu)

---

**FIN P7 — BLOC 1A — Recevabilité & Création de Dossier**
