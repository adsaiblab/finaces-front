═══════════════════════════════════════════════════════════
PROMPT 9 — BLOC 2 — États Financiers (Tabs + Formulaire Multi-Exercices)
Dépend de : PROMPT 8 (Gate Documentaire)
Peut être parallélisé avec : Aucun
═══════════════════════════════════════════════════════════

## CONTEXTE

La page **États Financiers** est où l'utilisateur **saisit ou importe** les données financières brutes (non normalisées) depuis les documents validés au Gate.

Trois modes d'entrée:
1. **Saisie Manuelle** (formulaires tabulation par état)
2. **Upload Excel** (template Excel multi-feuilles, une par état)
3. **API Intégration** (liaison avec backend comptable, future)

Pour chaque **exercice fiscal** (min 3: n, n-1, n-2), l'utilisateur remplit:
- **Bilan Actif** : actifs courants + non-courants, total auto-calculé
- **Bilan Passif** : capitaux propres + passifs courants/non-courants, total auto-calculé
- **Compte de Résultat** : revenus → charges → résultat net + EBITDA
- **Tableau de Flux de Trésorerie (TFT)** : activités exploitation/investissement/financement

**Règle MCC-R7** : Ratios sont calculés **uniquement sur données normalisées** (P10), pas sur brutes. Cette page capture juste le "raw input".

**Status Transition** :
- FINANCIAL_INPUT (après Gate passé)
- Après [Lancer Normalisation]: POST /normalize → status = NORMALIZATION_DONE

---

## RÈGLES MÉTIER APPLICABLES

**MCC-R7** : Ratios sur normalized data only. Cette page = raw input uniquement.

**Structures de Données Requis** (par exercice fiscal):

### BILAN ACTIF (FinancialStatementActive)
```
ACTIF COURANT:
  - liquid_assets: cash + équivalents (USD)
  - accounts_receivable: créances clients
  - inventory: stocks marchandises/matières
  - other_current_assets: avances, prépayés

  → current_assets = sum (auto-calc, LOCKED)

ACTIF NON-COURANT:
  - tangible_assets: immobilisations corporelles
  - intangible_assets: marques, brevets, goodwill
  - financial_assets: participations, placements
  - other_noncurrent_assets: autres

  → non_current_assets = sum (auto-calc, LOCKED)

TOTAL ACTIF = current_assets + non_current_assets (auto-calc, LOCKED)
```

### BILAN PASSIF (FinancialStatementLiability)
```
CAPITAUX PROPRES:
  - equity: total QP
  - share_capital: capital social
  - reserves: réserves légales
  - retained_earnings_prior: résultats antérieurs
  - current_year_earnings: résultat de l'année

  → total_equity = sum (auto-calc)

PASSIF COURANT:
  - current_liabilities: dettes court terme
  - short_term_debt: emprunts CT
  - accounts_payable: dettes fournisseurs
  - tax_and_social_liabilities: impôts/cotisations dues
  - other_current_liabilities: autres

  → total_current_liabilities = sum (auto-calc)

PASSIF NON-COURANT:
  - non_current_liabilities: dettes LT
  - long_term_debt: emprunts LT
  - long_term_provisions: provisions

  → total_non_current_liabilities = sum (auto-calc)

TOTAL PASSIF ET ÉQUITÉ = total_equity + total_current_liabilities + total_non_current_liabilities
(auto-calc, LOCKED)
```

**Contrôle d'Équilibre** (Bilan):
- ACTIF = PASSIF ± 1000 USD (tolérance arrondi)
- Afficher barre de vérification VERTE si OK, ROUGE si déséquilibré
- Message: "Équilibre bilan: {difference} USD"

### COMPTE DE RÉSULTAT (IncomeStatement)
```
OPÉRATIONS:
  - revenue: chiffre d'affaires
  - sold_production: production vendue
  - other_operating_revenue: autres revenus opérationels

  → operating_revenue = sum

  - operating_expenses: total charges opérationnelles
  → operating_income = operating_revenue - operating_expenses (auto-calc)

RÉSULTAT FINANCIER:
  - financial_revenue: intérêts reçus, gains
  - financial_expenses: intérêts payés, pertes
  → financial_income = financial_revenue - financial_expenses (auto-calc)

AVANT IMPÔT:
  → income_before_tax = operating_income + financial_income (auto-calc)

EXTRAORDINAIRE & IMPÔT:
  - extraordinary_income: revenus extraordinaires
  - extraordinary_expenses: charges extraordinaires
  - income_tax: impôt sur le résultat

  → net_income = income_before_tax + (extra_income - extra_expenses) - income_tax (auto-calc)

INDICATEUR:
  → ebitda = operating_income + amortization + depreciation (à saisir ou auto)
```

### TABLEAU DE FLUX DE TRÉSORERIE (CashFlowStatement)
```
ACTIVITÉ EXPLOITATION:
  - operating_cash_flow: flux net exploitation

ACTIVITÉ INVESTISSEMENT:
  - investing_cash_flow: acquisitions - ventes actifs

ACTIVITÉ FINANCEMENT:
  - financing_cash_flow: emprunts - remboursements

NET CHANGE IN CASH:
  → change_in_cash = sum 3 activités (auto-calc)

TRÉSORERIE:
  - beginning_cash: solde initial
  → ending_cash = beginning_cash + change_in_cash (auto-calc)

AUTRES INDICATEURS:
  - headcount: effectifs année
  - backlog_value: carnet commandes
  - capex: investissements
  - dividends: dividendes versés
```

**Status Workflow** :
- FINANCIAL_INPUT: mode édition actif
- [Lancer Normalisation]: POST /api/v1/cases/{id}/normalize → status = NORMALIZATION_DONE

---

## FICHIERS À CRÉER / MODIFIER

### Création :
1. `src/app/pages/financials/financials.component.ts`
2. `src/app/pages/financials/financials.component.html`
3. `src/app/pages/financials/financials.component.scss`
4. `src/app/pages/financials/tabs/tab-bilan-actif.component.ts`
5. `src/app/pages/financials/tabs/tab-bilan-actif.component.html`
6. `src/app/pages/financials/tabs/tab-bilan-actif.component.scss`
7. `src/app/pages/financials/tabs/tab-bilan-passif.component.ts`
8. `src/app/pages/financials/tabs/tab-bilan-passif.component.html`
9. `src/app/pages/financials/tabs/tab-bilan-passif.component.scss`
10. `src/app/pages/financials/tabs/tab-income-statement.component.ts`
11. `src/app/pages/financials/tabs/tab-income-statement.component.html`
12. `src/app/pages/financials/tabs/tab-income-statement.component.scss`
13. `src/app/pages/financials/tabs/tab-cash-flow.component.ts`
14. `src/app/pages/financials/tabs/tab-cash-flow.component.html`
15. `src/app/pages/financials/tabs/tab-cash-flow.component.scss`
16. `src/app/pages/financials/components/balance-check.component.ts`
17. `src/app/pages/financials/components/balance-check.component.html`
18. `src/app/pages/financials/components/exercise-selector.component.ts`
19. `src/app/pages/financials/components/exercise-selector.component.html`

### Modification :
1. `src/app/app.routes.ts` : ajouter route `/cases/:caseId/financials`
2. `src/app/services/case.service.ts` : ajouter méthodes financial (voir API)
3. `src/app/models/financial.model.ts` : créer (FinancialStatementRawOut, FinancialStatementCreate, etc.)

---

## SPÉCIFICATION TECHNIQUE COMPLÈTE

### Route et Navigation
- **Route** : `/cases/:caseId/financials`
- **Breadcrumb** : "Dossiers > {ref} > États Financiers"
- **Page Title** : "États Financiers — {bidder_name}"
- **Prerequisite** : Case status must be FINANCIAL_INPUT (after gate passed)

### Top Header

```
┌─────────────────────────────────────────────────────┐
│ États Financiers — Société XYZ SARL                 │
│ [Breadcrumb: Dossiers > MCC-2024-001 > Financials]  │
│                                                      │
│ Exercice: [2023] [2022] [2021] [+ Ajouter]         │
│ Mode: [Manuelle] [Upload Excel] [API] [Historique] │
│ [Upload Excel Global]                              │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Exercise Pills & Selector

Composant `exercise-selector.component`:

**Pills affichées horizontalement** (ex: [2023] [2022] [2021]):
- Click pill: onglet Tab-group bascule au bon exercice
- Pill actif: background primaire, texte blanc
- Pill inactif: background gris, texte foncé
- Bouton [+ Ajouter exercice]: ouvre dialog
  - Input année (ex: 2020)
  - POST /api/v1/cases/{id}/financials (empty/skeleton)
  - Ajoute pill + onglet

---

### Mat-Tab-Group (4 Tabs par Exercice)

Sélection d'exercice change l'onglet actif dans tous les 4 tabs.

#### TAB 1 — Bilan Actif

Composant `tab-bilan-actif.component`:

**FormGroup : activForm**

```
┌─────────────────────────────────────────────────┐
│ ACTIF COURANT                                    │
│                                                  │
│ Liquidités & Équivalents:        [input] USD    │
│ Créances Clients:                [input] USD    │
│ Stocks:                          [input] USD    │
│ Autres Actifs Courants:          [input] USD    │
│                                                  │
│ = Total Actif Courant:  [LOCKED] [1,234,567]   │
│                                                  │
├─────────────────────────────────────────────────┤
│ ACTIF NON-COURANT                               │
│                                                  │
│ Immobilisations Corporelles:     [input] USD    │
│ Immobilisations Incorporelles:   [input] USD    │
│ Actifs Financiers:               [input] USD    │
│ Autres Actifs Non-Courants:      [input] USD    │
│                                                  │
│ = Total Actif Non-Courant: [LOCKED] [567,890]  │
│                                                  │
├─────────────────────────────────────────────────┤
│ TOTAL ACTIF:              [LOCKED] [1,802,457]  │
└─────────────────────────────────────────────────┘
```

**Inputs** (tous mat-form-field type="number"):
- liquid_assets
- accounts_receivable
- inventory
- other_current_assets
- (auto calc current_assets)
- tangible_assets
- intangible_assets
- financial_assets
- other_noncurrent_assets
- (auto calc non_current_assets)
- (auto calc TOTAL actif)

**Validation** :
- Tous > 0 (ou null pour optionnels)
- Format currency (accepte . pour décimales)

**Auto-Calculations** :
- current_assets = sum(4 champs courants)
- non_current_assets = sum(4 champs non-courants)
- total_actif = current + non_current

**Formatting** :
- Champs inputs: format USD (DecimalPipe, thousand separators)
- Locked fields: affichage en gris, contient icône 🔒

---

#### TAB 2 — Bilan Passif

Composant `tab-bilan-passif.component`:

**FormGroup : liabilityForm**

```
┌─────────────────────────────────────────────────┐
│ CAPITAUX PROPRES                                 │
│                                                  │
│ Capital Social:                  [input] USD    │
│ Réserves Légales:                [input] USD    │
│ Résultats Antérieurs:            [input] USD    │
│ Résultat Année:                  [input] USD    │
│                                                  │
│ = Total Capitaux Propres:  [LOCKED] [456,789]  │
│                                                  │
├─────────────────────────────────────────────────┤
│ PASSIF COURANT                                   │
│                                                  │
│ Dettes Court Terme:              [input] USD    │
│ Emprunts CT:                     [input] USD    │
│ Dettes Fournisseurs:             [input] USD    │
│ Impôts & Cotisations Dues:       [input] USD    │
│ Autres Passifs Courants:         [input] USD    │
│                                                  │
│ = Total Passif Courant:    [LOCKED] [345,678]  │
│                                                  │
├─────────────────────────────────────────────────┤
│ PASSIF NON-COURANT                              │
│                                                  │
│ Dettes Long Terme:               [input] USD    │
│ Emprunts LT:                     [input] USD    │
│ Provisions:                      [input] USD    │
│                                                  │
│ = Total Passif Non-Courant: [LOCKED] [234,567]│
│                                                  │
├─────────────────────────────────────────────────┤
│ TOTAL PASSIF & ÉQUITÉ:     [LOCKED] [1,037,034]│
└─────────────────────────────────────────────────┘
```

**Inputs** : tous USD, format currency

**Auto-Calculations** : summation per section + total

---

#### TAB 3 — Compte de Résultat

Composant `tab-income-statement.component`:

```
┌─────────────────────────────────────────────────┐
│ OPÉRATIONS                                       │
│                                                  │
│ Chiffre d'Affaires:              [input] USD    │
│ Production Vendue:               [input] USD    │
│ Autres Revenus Opérationnels:    [input] USD    │
│                                                  │
│ = Total Revenus Opérationnels: [LOCKED] [X]    │
│                                                  │
│ Charges Opérationnelles:         [input] USD    │
│                                                  │
│ = Résultat Opérationnel:       [LOCKED] [Y]    │
│                                                  │
├─────────────────────────────────────────────────┤
│ RÉSULTAT FINANCIER                              │
│                                                  │
│ Revenus Financiers:              [input] USD    │
│ Charges Financières:             [input] USD    │
│                                                  │
│ = Résultat Financier:          [LOCKED] [Z]    │
│                                                  │
├─────────────────────────────────────────────────┤
│ RÉSULTAT AVANT IMPÔT:           [LOCKED] [Y+Z] │
│                                                  │
│ Revenus Extraordinaires:         [input] USD    │
│ Charges Extraordinaires:         [input] USD    │
│ Impôt sur le Résultat:           [input] USD    │
│                                                  │
│ = RÉSULTAT NET:                [LOCKED] [X]    │
│                                                  │
├─────────────────────────────────────────────────┤
│ INDICATEUR DE PERFORMANCE:                       │
│                                                  │
│ EBITDA:                          [input] USD    │
│ (ou auto-calculé si amort. saisi)               │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Inputs** : tous USD

---

#### TAB 4 — Tableau de Flux de Trésorerie (TFT)

Composant `tab-cash-flow.component`:

```
┌─────────────────────────────────────────────────┐
│ FLUX OPÉRATIONNELS                              │
│ Flux net d'exploitation:         [input] USD    │
│                                                  │
│ FLUX D'INVESTISSEMENT                           │
│ Flux net d'investissement:       [input] USD    │
│                                                  │
│ FLUX DE FINANCEMENT                             │
│ Flux net de financement:         [input] USD    │
│                                                  │
│ = Variation Nette de Trésorerie: [LOCKED] [X] │
│                                                  │
├─────────────────────────────────────────────────┤
│ TRÉSORERIE                                       │
│ Solde Initial:                   [input] USD    │
│ Solde Final:                  [LOCKED] [X+Y]   │
│                                                  │
├─────────────────────────────────────────────────┤
│ AUTRES INDICATEURS                              │
│                                                  │
│ Effectifs (FTE):                 [input] number │
│ Carnet de Commandes:             [input] USD    │
│ Capex (Investissements):         [input] USD    │
│ Dividendes Versés:               [input] USD    │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

### Balance Check Component

Composant `balance-check.component`:

Affiché **sous Tab 2 (Passif)**, après le formulaire:

```
┌─────────────────────────────────────────────────┐
│ VÉRIFICATION D'ÉQUILIBRE DU BILAN               │
│                                                  │
│ ACTIF:          1,802,457 USD                   │
│ PASSIF+ÉQUITÉ:  1,802,564 USD                   │
│ Différence:         107 USD (ÉQUILIBRÉ ✓)       │
│                                                  │
│ Tolérance: ±1,000 USD                           │
└─────────────────────────────────────────────────┘
```

**Logic** :
- difference = |total_actif - (total_equity + total_current_liab + total_non_current_liab)|
- Si difference <= 1000: ✓ ÉQUILIBRÉ (couleur vert)
- Si difference > 1000: ✗ DÉSÉQUILIBRÉ (couleur rouge)

---

### Action Buttons

Bas de page, fixed bottom sticky:

**Row 1** :
- `[Enregistrer Exercice]` (mat-raised-button, color="primary")
  - POST /api/v1/cases/{id}/financials
  - Toast: "Données exercice {year} sauvegardées"
  - Reste sur page

**Row 2** :
- `[Lancer Normalisation]` (mat-raised-button, color="primary")
  - POST /api/v1/cases/{id}/normalize
  - Spinner: "Normalisation en cours..."
  - Succès: Toast vert + redirection `/cases/{id}/normalization` (P10)
  - Erreur: Toast rouge, reste sur page

**Row 3** :
- `[Annuler]` (mat-button)
  - Confirmation modale "Les changements non-sauvegardés seront perdus"
  - Navigue `/dashboard` si OK

---

### Upload Excel Mode

Optionnel mais utile pour MVP+:

Bouton `[Upload Excel Global]` en haut:
- Accepte fichier .xlsx/.xls avec structure multi-feuilles
  - Feuille "Bilan Actif": colonnes = années, rows = postes actif
  - Feuille "Bilan Passif": idem passif
  - Feuille "CPC": idem CPC
  - Feuille "TFT": idem TFT
- Parser fichier → populate tous exercices/tous tabs
- Toast: "X exercices importés avec succès"

**NOT REQUIRED** pour P9 MVP. Can be deferred.

---

## CONTRAINTES ANGULAR

### Standalone Components

```typescript
@Component({
  selector: 'app-financials',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    MatTabsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressBarModule,
    MatTooltipModule, TabBilanActifComponent,
    TabBilanPassifComponent, TabIncomeStatementComponent,
    TabCashFlowComponent, BalanceCheckComponent,
    ExerciseSelectorComponent
  ],
  templateUrl: './financials.component.html',
  styleUrl: './financials.component.scss'
})
export class FinancialsComponent implements OnInit, OnDestroy {
  // ...
}
```

### Form Management

Reactive Forms avec FormBuilder:

```typescript
export class TabBilanActifComponent implements OnInit {
  activForm: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
    this.activForm = this.fb.group({
      liquid_assets: [null, [Validators.min(0)]],
      accounts_receivable: [null, [Validators.min(0)]],
      inventory: [null, [Validators.min(0)]],
      other_current_assets: [null, [Validators.min(0)]],
      current_assets: [{ value: null, disabled: true }],
      tangible_assets: [null, [Validators.min(0)]],
      // ...
      total_actif: [{ value: null, disabled: true }]
    });
  }

  ngOnInit(): void {
    // Listen to changes, update auto-calcs
    this.activForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.updateCalculatedFields());
  }

  private updateCalculatedFields(): void {
    const current = this.sumCurrentAssets();
    const nonCurrent = this.sumNonCurrentAssets();

    this.activForm.patchValue(
      {
        current_assets: current,
        non_current_assets: nonCurrent,
        total_actif: current + nonCurrent
      },
      { emitEvent: false }
    );
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Multi-Exercise State

Parent component (financials.component) gère switch d'exercice:

```typescript
export class FinancialsComponent implements OnInit {
  selectedYear: number = new Date().getFullYear();
  financialStatements$: Observable<FinancialStatementRawOut[]>;

  onExerciseChange(year: number): void {
    this.selectedYear = year;
    // child components recalc via Input
  }
}
```

### Change Detection

Strategy OnPush partout:

```typescript
changeDetection: ChangeDetectionStrategy.OnPush
```

---

## BINDING API

### 1. GET /api/v1/cases/{id}/financials

**Response: FinancialStatementRawOut[]**
```json
{
  "statements": [
    {
      "id": "uuid",
      "case_id": "uuid-case",
      "fiscal_year": 2023,
      "bilan_actif": {
        "liquid_assets": 123456,
        "accounts_receivable": 234567,
        "inventory": 345678,
        "other_current_assets": 456789,
        "current_assets": 1160490,
        "tangible_assets": 567890,
        "intangible_assets": 678901,
        "financial_assets": 789012,
        "other_noncurrent_assets": 890123,
        "non_current_assets": 2925926,
        "total_actif": 4086416
      },
      "bilan_passif": {
        "share_capital": 100000,
        "reserves": 200000,
        "retained_earnings_prior": 300000,
        "current_year_earnings": 400000,
        "total_equity": 1000000,
        "short_term_debt": 500000,
        "accounts_payable": 600000,
        "tax_and_social_liabilities": 700000,
        "other_current_liabilities": 800000,
        "total_current_liabilities": 2600000,
        "long_term_debt": 1200000,
        "long_term_provisions": 300000,
        "total_non_current_liabilities": 1500000,
        "total_liabilities_and_equity": 5100000
      },
      "income_statement": {
        "revenue": 5000000,
        "sold_production": 3000000,
        "other_operating_revenue": 500000,
        "operating_revenue": 8500000,
        "operating_expenses": 5000000,
        "operating_income": 3500000,
        "financial_revenue": 100000,
        "financial_expenses": 200000,
        "financial_income": -100000,
        "income_before_tax": 3400000,
        "extraordinary_income": 50000,
        "extraordinary_expenses": 25000,
        "income_tax": 600000,
        "net_income": 2825000,
        "ebitda": 4000000
      },
      "cash_flow": {
        "operating_cash_flow": 2000000,
        "investing_cash_flow": -1000000,
        "financing_cash_flow": -500000,
        "change_in_cash": 500000,
        "beginning_cash": 1000000,
        "ending_cash": 1500000,
        "headcount": 50,
        "backlog_value": 3000000,
        "capex": 800000,
        "dividends": 200000
      },
      "created_at": "2026-03-16T10:00:00Z",
      "updated_at": "2026-03-16T14:30:00Z"
    }
  ],
  "total": 3
}
```

### 2. POST /api/v1/cases/{id}/financials

**Request: FinancialStatementCreate**
```json
{
  "fiscal_year": 2023,
  "bilan_actif": {
    "liquid_assets": 123456,
    "accounts_receivable": 234567,
    "inventory": 345678,
    "other_current_assets": 456789,
    "tangible_assets": 567890,
    "intangible_assets": 678901,
    "financial_assets": 789012,
    "other_noncurrent_assets": 890123
  },
  "bilan_passif": {
    "share_capital": 100000,
    "reserves": 200000,
    "retained_earnings_prior": 300000,
    "current_year_earnings": 400000,
    "short_term_debt": 500000,
    "accounts_payable": 600000,
    "tax_and_social_liabilities": 700000,
    "other_current_liabilities": 800000,
    "long_term_debt": 1200000,
    "long_term_provisions": 300000
  },
  "income_statement": {
    "revenue": 5000000,
    "sold_production": 3000000,
    "other_operating_revenue": 500000,
    "operating_expenses": 5000000,
    "financial_revenue": 100000,
    "financial_expenses": 200000,
    "extraordinary_income": 50000,
    "extraordinary_expenses": 25000,
    "income_tax": 600000,
    "ebitda": 4000000
  },
  "cash_flow": {
    "operating_cash_flow": 2000000,
    "investing_cash_flow": -1000000,
    "financing_cash_flow": -500000,
    "beginning_cash": 1000000,
    "headcount": 50,
    "backlog_value": 3000000,
    "capex": 800000,
    "dividends": 200000
  }
}
```

**Response: FinancialStatementRawOut**

### 3. DELETE /api/v1/cases/{id}/financials/{stmt_id}

**Response: 204 No Content**

### 4. POST /api/v1/cases/{id}/normalize

**Response: FinancialStatementNormalizedSchema**
(detailed in P10)

### 5. Service Methods to Add

```typescript
// case.service.ts

getFinancials(caseId: string): Observable<FinancialStatementRawOut[]> {
  return this.http.get<FinancialStatementRawOut[]>(
    `${this.apiUrl}/cases/${caseId}/financials`
  );
}

saveFinancials(caseId: string, data: FinancialStatementCreate): Observable<FinancialStatementRawOut> {
  return this.http.post<FinancialStatementRawOut>(
    `${this.apiUrl}/cases/${caseId}/financials`,
    data
  );
}

deleteFinancials(caseId: string, stmtId: string): Observable<void> {
  return this.http.delete<void>(
    `${this.apiUrl}/cases/${caseId}/financials/${stmtId}`
  );
}

normalizeFinancials(caseId: string): Observable<FinancialStatementNormalizedSchema> {
  return this.http.post<FinancialStatementNormalizedSchema>(
    `${this.apiUrl}/cases/${caseId}/normalize`,
    {}
  );
}
```

---

## CRITÈRES DE VALIDATION

### Fonctionnel

- [ ] Route `/cases/{id}/financials` charge dossier
- [ ] Exercise pills affichent tous exercices + [+Ajouter]
- [ ] Click pill: tab-group bascule exercice
- [ ] Tab 1 (Actif): inputs numériques, auto-calc de current_assets
- [ ] Tab 2 (Passif): inputs + auto-calc + balance check component
- [ ] Balance check: vert si ±1000, rouge sinon
- [ ] Tab 3 (CPC): auto-calc operating_income, financial_income, net_income
- [ ] Tab 4 (TFT): auto-calc ending_cash
- [ ] [Enregistrer Exercice] POST financials → toast
- [ ] [Lancer Normalisation] POST normalize → redirect P10
- [ ] [Annuler] confirm modale → redirect dashboard
- [ ] Locked fields (auto-calc): displayed in gray, non-editable
- [ ] All inputs: currency formatting USD

### Visuel & UX

- [ ] Tab header clair avec 4 onglets (Actif, Passif, CPC, TFT)
- [ ] Exercise pills responsive
- [ ] Input labels explicites
- [ ] Auto-calc fields: 🔒 icon + gris background
- [ ] Balance check: traffic light color (vert/rouge)
- [ ] Buttons sticky bottom
- [ ] Spacing/padding cohérent
- [ ] Responsive mobile: stacked tabs

### Performance

- [ ] Form load < 500ms
- [ ] Tab switch instant (no API call per switch)
- [ ] Auto-calc updates immediate (no lag)

### Validation

- [ ] Inputs > 0 (ou null)
- [ ] Currency format validation (no letters)
- [ ] Balance check must pass before [Lancer Normalisation]

---

## FICHIERS LIVRÉS À LA FIN DE CE PROMPT

1. `src/app/pages/financials/financials.component.ts`
2. `src/app/pages/financials/financials.component.html`
3. `src/app/pages/financials/financials.component.scss`
4. `src/app/pages/financials/tabs/tab-bilan-actif.component.ts`
5. `src/app/pages/financials/tabs/tab-bilan-actif.component.html`
6. `src/app/pages/financials/tabs/tab-bilan-actif.component.scss`
7. `src/app/pages/financials/tabs/tab-bilan-passif.component.ts`
8. `src/app/pages/financials/tabs/tab-bilan-passif.component.html`
9. `src/app/pages/financials/tabs/tab-bilan-passif.component.scss`
10. `src/app/pages/financials/tabs/tab-income-statement.component.ts`
11. `src/app/pages/financials/tabs/tab-income-statement.component.html`
12. `src/app/pages/financials/tabs/tab-income-statement.component.scss`
13. `src/app/pages/financials/tabs/tab-cash-flow.component.ts`
14. `src/app/pages/financials/tabs/tab-cash-flow.component.html`
15. `src/app/pages/financials/tabs/tab-cash-flow.component.scss`
16. `src/app/pages/financials/components/balance-check.component.ts`
17. `src/app/pages/financials/components/balance-check.component.html`
18. `src/app/pages/financials/components/balance-check.component.scss`
19. `src/app/pages/financials/components/exercise-selector.component.ts`
20. `src/app/pages/financials/components/exercise-selector.component.html`
21. `src/app/pages/financials/components/exercise-selector.component.scss`
22. `src/app/app.routes.ts` — modifié (route `/cases/:caseId/financials`)
23. `src/app/services/case.service.ts` — modifié (5 nouvelles méthodes)
24. `src/app/models/financial.model.ts` — créé

---

## NOTES TECHNIQUES

- Decimal pipe: `{{ value | number:'1.2-2' }}`
- Currency pipe: `{{ value | currency:'USD' }}`
- Locked inputs: `[disabled]="true"` ou `disabled: true` en FormBuilder
- Auto-calc: RxJS valueChanges + debounceTime(200)
- Balance check tolerance: Math.abs(actif - passif) <= 1000
- Status after financials: stays FINANCIAL_INPUT until POST normalize
- Validation: all inputs > 0 (or null for optional)

---

**FIN P9 — BLOC 2 — États Financiers**
