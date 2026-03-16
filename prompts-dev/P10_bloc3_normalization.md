═══════════════════════════════════════════════════════════
PROMPT 10 — BLOC 3 — Normalisation IFRS (Lecture Résultat + Tableau Comparatif)
Dépend de : PROMPT 9 (États Financiers)
Peut être parallélisé avec : Aucun
═══════════════════════════════════════════════════════════

## CONTEXTE

La page **Normalisation IFRS** affiche le **résultat du retraitement comptable** appliqué par le backend. C'est une page de **LECTURE SEULE** (READ-ONLY) car le moteur de normalisation calcule automatiquement les ajustements selon les normes comptables détectées.

**Règle MCC-R7** : Ratios sont calculés sur les données **normalisées** (pas sur brutes). Cette page valide la qualité des retraitements avant calcul des ratios (P11, future).

Le workflow:
1. Utilisateur saisit finances brutes (P9)
2. Click [Lancer Normalisation] → POST /normalize
3. Backend:
   - Détecte norme comptable (ex: Maroc CNC, IFRS, US GAAP, etc.)
   - Applique retraitements standard (EBITDA, conversion devise, reclassification leasing, etc.)
   - Retourne FinancialStatementNormalizedSchema (IFRS-aligned)
4. Frontend affiche:
   - Tableau comparatif: Brut vs Normalisé
   - Liste des ajustements appliqués
   - Norme détectée + norme appliquée
   - Taux de change utilisé
5. User valide → [Lancer Calcul des Ratios]

**Status Transition** :
- FINANCIAL_INPUT (P9) → [Lancer Normalisation] → POST → status = NORMALIZATION_DONE
- Ensuite: NORMALIZATION_DONE → [Calc Ratios] → POST ratios/compute → status = RATIOS_COMPUTED (P11)

---

## RÈGLES MÉTIER APPLICABLES

**MCC-R7** : Ratios sont calculés uniquement sur données normalisées.

**Normalisation Automatique** : Le backend applique des retraitements selon la norme comptable détectée:
- **EBITDA Restatement** : si fourni brut, recalculer selon: EBITDA = Operating Income + Amortization + Depreciation
- **Currency Conversion** : si documents en devise locale (ex: MAD), convertir en USD via taux change officiel
- **Lease Capitalization** : reclasser leases opérationnels en immobilisations + dettes (IAS 16/IFRS 16)
- **Deferred Taxes** : ajustement différé taxes si applicable
- **Intercompany Eliminations** : si groupe, éliminer transactions intra-groupe
- **Provisions** : ajuster provisions à valeur actualisée si applicable

**Norme Comptable Détectée** : Le backend identifie le standard source et applique IFRS en output:
- MAROC CNC (Plan Comptable Marocain)
- FRENCH PCGA (Plan Comptable Général Français)
- US GAAP (US General Accepted Accounting Principles)
- IFRS
- Other

**Exchange Rate** : taux change officiel utilisé pour conversion (ex: 1 USD = 10.5 MAD au 2026-03-16)

**Output: FinancialStatementNormalizedSchema**
```
{
  "id": uuid,
  "case_id": uuid,
  "fiscal_year": 2023,
  "source_standard": "MAROC CNC",
  "applied_standard": "IFRS",
  "exchange_rate_used": 10.5,
  "exchange_rate_date": "2026-03-16",

  "normalized_bilan_actif": { ... },
  "normalized_bilan_passif": { ... },
  "normalized_income_statement": { ... },
  "normalized_cash_flow": { ... },

  "adjustments": [
    {
      "id": uuid,
      "type": "EBITDA_RESTATEMENT",
      "line_item": "EBITDA",
      "original_value": 3500000,
      "adjusted_value": 4000000,
      "adjustment_amount": 500000,
      "percentage_change": 14.3,
      "explanation": "Retraitement EBITDA: Operating Income + Depreciation"
    },
    { ... }
  ],

  "normalized_at": "2026-03-16T14:35:00Z",
  "processed_by": "SYSTEM"
}
```

---

## FICHIERS À CRÉER / MODIFIER

### Création :
1. `src/app/pages/normalization/normalization.component.ts`
2. `src/app/pages/normalization/normalization.component.html`
3. `src/app/pages/normalization/normalization.component.scss`
4. `src/app/pages/normalization/components/comparative-table.component.ts`
5. `src/app/pages/normalization/components/comparative-table.component.html`
6. `src/app/pages/normalization/components/comparative-table.component.scss`
7. `src/app/pages/normalization/components/adjustments-list.component.ts`
8. `src/app/pages/normalization/components/adjustments-list.component.html`
9. `src/app/pages/normalization/components/adjustments-list.component.scss`
10. `src/app/pages/normalization/components/accounting-standard-section.component.ts`
11. `src/app/pages/normalization/components/accounting-standard-section.component.html`

### Modification :
1. `src/app/app.routes.ts` : ajouter route `/cases/:caseId/normalization`
2. `src/app/services/case.service.ts` : ajouter méthode getNormalizedFinancials()
3. `src/app/models/financial.model.ts` : extension (FinancialStatementNormalizedSchema)

---

## SPÉCIFICATION TECHNIQUE COMPLÈTE

### Route et Navigation
- **Route** : `/cases/:caseId/normalization`
- **Breadcrumb** : "Dossiers > {ref} > Normalisation"
- **Page Title** : "Normalisation IFRS — {bidder_name}"
- **Prerequisite** : Case status must be NORMALIZATION_DONE

### Top Header

```
┌─────────────────────────────────────────────────────┐
│ Normalisation IFRS — Société XYZ SARL               │
│ [Breadcrumb: Dossiers > MCC-2024-001 > Normalisation│
│                                                      │
│ Badge: ✓ NORMALISÉ                                  │
│ Exercice: [2023]                                    │
│ Ajustements: 7 retraitements appliqués              │
│ [Recalculer] (si données changed)                   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Topbar Components** :
- **Badge "NORMALISÉ"** : vert checkmark + texte (visual confirmation)
- **Exercise Selector** : dropdown ou pills (2023) — read-only (pas de multi-exercise ici)
- **Adjustments Count** : "X retraitements appliqués"
- **[Recalculer]** : bouton optionnel (POST normalize again si données re-entrées)

---

### Main Content (READ-ONLY)

Layout vertical scrollable:

#### Section 1 : Accounting Standard Information

Composant `accounting-standard-section.component`:

```
┌─────────────────────────────────────────────────────┐
│ NORME COMPTABLE                                     │
│                                                      │
│ Norme Détectée:        Maroc CNC (Plan Comptable)  │
│ Norme Appliquée:       IFRS (International)        │
│ Taux de Change:        1 USD = 10.5 MAD            │
│ Date du Taux:          16 Mars 2026                 │
│ Normalisé à:           16 Mars 2026 14:35 UTC      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Display Items** (READ-ONLY):
- source_standard (detected)
- applied_standard (always IFRS for MVP)
- exchange_rate_used
- exchange_rate_date
- normalized_at (timestamp)

---

#### Section 2 : Comparative Table

Composant `comparative-table.component`:

**Tableau Principal** : colonnes horizontales

```
┌──────────────────────┬──────────────────┬──────────────────┬────┬──────┐
│ Poste Financier      │ Valeur Brute     │ Valeur Normalisée│ Δ  │Note  │
├──────────────────────┼──────────────────┼──────────────────┼────┼──────┤
│ ACTIF COURANT        │                  │                  │    │      │
│ Liquidités           │ 123,456 USD      │ 123,456 USD      │ — │ OK   │
│ Créances Clients     │ 234,567 USD      │ 234,567 USD      │ — │ OK   │
│ Stocks               │ 345,678 USD      │ 328,194 USD      │ -5% │Δ    │
│ Total Actif Courant  │ 1,160,490 USD    │ 1,143,006 USD    │ -2% │      │
│                      │                  │                  │    │      │
│ ACTIF NON-COURANT    │                  │                  │    │      │
│ Immo. Corp.          │ 567,890 USD      │ 612,345 USD      │ +8% │Δ    │
│ Immo. Incorp.        │ 678,901 USD      │ 678,901 USD      │ — │ OK   │
│ Total Actif NCourant │ 2,925,926 USD    │ 3,065,781 USD    │ +5% │      │
│                      │                  │                  │    │      │
│ TOTAL ACTIF          │ 4,086,416 USD    │ 4,208,787 USD    │ +3% │      │
├──────────────────────┼──────────────────┼──────────────────┼────┼──────┤
│ CAPITAUX PROPRES     │                  │                  │    │      │
│ Capital Social       │ 100,000 USD      │ 100,000 USD      │ — │ OK   │
│ Résultats Antérieurs │ 300,000 USD      │ 300,000 USD      │ — │ OK   │
│ Rés. Exercice        │ 400,000 USD      │ 450,000 USD      │ +13% │Δ   │
│ Total Équité         │ 1,000,000 USD    │ 1,050,000 USD    │ +5% │      │
│                      │                  │                  │    │      │
│ PASSIF COURANT       │                  │                  │    │      │
│ Dettes CT            │ 1,100,000 USD    │ 950,000 USD      │ -14% │Δ   │
│ Dettes Fournisseurs  │ 600,000 USD      │ 600,000 USD      │ — │ OK   │
│ Total Passif Courant │ 2,600,000 USD    │ 2,450,000 USD    │ -6% │      │
│                      │                  │                  │    │      │
│ PASSIF NON-COURANT   │                  │                  │    │      │
│ Emprunts LT          │ 1,200,000 USD    │ 1,350,000 USD    │ +13% │Δ   │
│ Total Passif NCour.  │ 1,500,000 USD    │ 1,650,000 USD    │ +10% │      │
│                      │                  │                  │    │      │
│ PASSIF + ÉQUITÉ      │ 5,100,000 USD    │ 5,150,000 USD    │ +1% │      │
└──────────────────────┴──────────────────┴──────────────────┴────┴──────┘
```

**Colonnes** :
1. **Poste Financier** : nom du line item (hierarchical indentation)
2. **Valeur Brute** : montant original (non-normalisé)
3. **Valeur Normalisée** : montant après retraitements
4. **Δ (Delta)** : différence en %, avec icône/couleur:
   - vert "—" si Δ = 0
   - orange si Δ ∈ [0.1%, 10%]
   - rouge si Δ > 10%
5. **Note** : "OK", "Δ" (marqué), commentaire court

**Data Grouping** :
- Section Bilan Actif (actif courant + non-courant + total)
- Section Bilan Passif (équité + passifs + total)
- Section Compte de Résultat (si applicable: revenus, charges, résultat)
- Section TFT (si applicable: flux opér./invest./finan.)

**Interaction** :
- Rows avec Δ > 0%: hover → tooltip "Cliquer pour voir l'ajustement détaillé"
- Click row → scroll to adjustments section, filtre sur cet ajustement

---

#### Section 3 : Adjustments List

Composant `adjustments-list.component`:

**Affichage** : liste numérotée des retraitements appliqués

```
┌─────────────────────────────────────────────────────┐
│ RETRAITEMENTS APPLIQUÉS (7)                         │
│                                                      │
│ 1. EBITDA Restatement                               │
│    Ligne: EBITDA                                    │
│    Valeur Brute: 3,500,000 USD                      │
│    Valeur Normalisée: 4,000,000 USD                 │
│    Ajustement: +500,000 USD (+14.3%)                │
│    Explication: Ajout amortissement & dépréc.      │
│    Formule: Operating Income + Amort + Deprec      │
│                                                      │
│ 2. Currency Conversion (MAD → USD)                  │
│    Taux Appliqué: 1 USD = 10.5 MAD                 │
│    Poste: Liquidités (position initiale MAD)       │
│    Valeur MAD: 1,293,000 MAD                        │
│    Valeur USD: 123,143 USD                          │
│    Ajustement: -313 USD (-0.3%)                     │
│    Date Taux: 16 Mars 2026                          │
│                                                      │
│ 3. Lease Capitalization (IAS 16 / IFRS 16)          │
│    Type: Immobilisations Corporelles                │
│    Valeur Brute: 567,890 USD                        │
│    Valeur Normalisée: 612,345 USD                   │
│    Ajustement: +44,455 USD (+7.8%)                  │
│    Explication: Activation leases opérationnels    │
│    Impact Passif: +Dettes LT (+44,455)              │
│                                                      │
│ ... [3 autres ajustements] ...                      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Par Ajustement** :
- Titre : type (EBITDA_RESTATEMENT, CURRENCY_CONVERSION, LEASE_CAPITALIZATION, etc.)
- Ligne impactée : nom du poste
- Avant/Après : montants
- Δ : différence + %
- Explication : texte clair du retraitement
- Détails additionnels si applicable (taux change, formule, etc.)

**Tri** : par ordre application (comme retourné par backend)

**Empty State** : "Aucun ajustement nécessaire. Données conformes IFRS d'entrée."

---

### Action Buttons

Bas de page, sticky bottom:

**Button 1** :
- `[Lancer Calcul des Ratios]` (mat-raised-button, color="primary")
- POST /api/v1/cases/{id}/ratios/compute
- Spinner: "Calcul des ratios en cours..."
- Success:
  - Toast vert: "Ratios calculés. Prêts pour évaluation."
  - Status updated: RATIOS_COMPUTED
  - Optionnel: redirect `/cases/{id}/ratios` (future page)
- Error:
  - Toast rouge: "Erreur calcul ratios: {message}"
  - Reste sur page

**Button 2** :
- `[Retour Financials]` (mat-button, color="accent")
- Navigue `/cases/{id}/financials` (pour re-vérifier/modifier données brutes)

**Button 3** (optionnel) :
- `[Recalculer Normalisation]` (mat-button)
- POST /api/v1/cases/{id}/normalize (re-run si données changed)
- Refresh page content

---

## CONTRAINTES ANGULAR

### Standalone Components

```typescript
@Component({
  selector: 'app-normalization',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule, MatIconModule, MatBadgeModule,
    MatTooltipModule, MatTableModule, MatProgressSpinnerModule,
    ComparativeTableComponent, AdjustmentsListComponent,
    AccountingStandardSectionComponent
  ],
  templateUrl: './normalization.component.html',
  styleUrl: './normalization.component.scss'
})
export class NormalizationComponent implements OnInit {
  // ...
}
```

### Data Loading Pattern

```typescript
export class NormalizationComponent implements OnInit {
  caseId: string;
  normalized$: Observable<FinancialStatementNormalizedSchema>;
  isLoading = false;

  constructor(
    private caseService: CaseService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.caseId = this.route.snapshot.paramMap.get('caseId');
    this.loadNormalized();
  }

  private loadNormalized(): void {
    this.isLoading = true;
    this.normalized$ = this.caseService.getNormalizedFinancials(this.caseId)
      .pipe(
        finalize(() => this.isLoading = false),
        shareReplay(1)
      );
  }

  onLaunchRatios(): void {
    this.caseService.computeRatios(this.caseId).subscribe({
      next: () => {
        // toast success
        // optionnel: redirect
      },
      error: (err) => {
        // toast error
      }
    });
  }
}
```

### Change Detection

OnPush strategy:

```typescript
changeDetection: ChangeDetectionStrategy.OnPush
```

---

## BINDING API

### 1. GET /api/v1/cases/{id}/normalize (ou GET /api/v1/cases/{id}/normalized-financials)

**Response: FinancialStatementNormalizedSchema**
```json
{
  "id": "uuid-norm",
  "case_id": "uuid-case",
  "fiscal_year": 2023,
  "source_standard": "MAROC CNC",
  "applied_standard": "IFRS",
  "exchange_rate_used": 10.5,
  "exchange_rate_date": "2026-03-16",

  "normalized_bilan_actif": {
    "liquid_assets": 123456,
    "accounts_receivable": 234567,
    "inventory": 328194,
    "other_current_assets": 456789,
    "current_assets": 1143006,
    "tangible_assets": 612345,
    "intangible_assets": 678901,
    "financial_assets": 789012,
    "other_noncurrent_assets": 890123,
    "non_current_assets": 3065781,
    "total_actif": 4208787
  },

  "normalized_bilan_passif": {
    "share_capital": 100000,
    "reserves": 200000,
    "retained_earnings_prior": 300000,
    "current_year_earnings": 450000,
    "total_equity": 1050000,
    "short_term_debt": 650000,
    "accounts_payable": 600000,
    "tax_and_social_liabilities": 700000,
    "other_current_liabilities": 500000,
    "total_current_liabilities": 2450000,
    "long_term_debt": 1350000,
    "long_term_provisions": 300000,
    "total_non_current_liabilities": 1650000,
    "total_liabilities_and_equity": 5150000
  },

  "normalized_income_statement": {
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
    "income_tax": 575000,
    "net_income": 2850000,
    "ebitda": 4000000
  },

  "normalized_cash_flow": {
    "operating_cash_flow": 2000000,
    "investing_cash_flow": -1000000,
    "financing_cash_flow": -500000,
    "change_in_cash": 500000,
    "beginning_cash": 1000000,
    "ending_cash": 1500000
  },

  "adjustments": [
    {
      "id": "uuid-adj-1",
      "type": "EBITDA_RESTATEMENT",
      "line_item": "EBITDA",
      "original_value": 3500000,
      "adjusted_value": 4000000,
      "adjustment_amount": 500000,
      "percentage_change": 14.3,
      "explanation": "Ajout amortissement et dépréciations"
    },
    {
      "id": "uuid-adj-2",
      "type": "INVENTORY_ADJUSTMENT",
      "line_item": "Inventory",
      "original_value": 345678,
      "adjusted_value": 328194,
      "adjustment_amount": -17484,
      "percentage_change": -5.06,
      "explanation": "Ajustement provision dépréciation stock"
    },
    {
      "id": "uuid-adj-3",
      "type": "LEASE_CAPITALIZATION",
      "line_item": "Tangible Assets + Long Term Debt",
      "original_value_asset": 567890,
      "adjusted_value_asset": 612345,
      "original_value_liability": 0,
      "adjusted_value_liability": 44455,
      "adjustment_amount": 44455,
      "percentage_change": 7.83,
      "explanation": "Activation leases opérationnels (IFRS 16)"
    },
    {
      "id": "uuid-adj-4",
      "type": "CURRENCY_CONVERSION",
      "line_item": "Multiple (MAD→USD)",
      "exchange_rate": 10.5,
      "adjustment_amount": -313,
      "explanation": "Conversion MAD vers USD au taux officiel"
    },
    { ... }
  ],

  "normalized_at": "2026-03-16T14:35:00Z",
  "processed_by": "SYSTEM"
}
```

### 2. POST /api/v1/cases/{id}/ratios/compute

**Request: (empty body)**
```json
{}
```

**Response: CaseRatiosOut** (future P11)
```json
{
  "id": "uuid-ratios",
  "case_id": "uuid-case",
  "fiscal_year": 2023,
  "ratios": {
    "current_ratio": 0.99,
    "quick_ratio": 0.82,
    "debt_to_equity": 3.9,
    "gearing": 0.79,
    "marge_nette": 12.5,
    "roa": 4.2,
    "roe": 9.1,
    "ebitda_margin": 14.7,
    "dso_days": 28.1,
    "bfr_pct_ca": 8.3,
    // ... 15+ autres ratios
  },
  "z_score_altman": 1.8,
  "z_score_level": "GREY",
  "computed_at": "2026-03-16T14:40:00Z"
}
```

---

## CRITÈRES DE VALIDATION

### Fonctionnel

- [ ] Route `/cases/{id}/normalization` charge dossier
- [ ] Badge "✓ NORMALISÉ" affiché
- [ ] Norme détectée + appliquée affichées
- [ ] Taux change affiché
- [ ] Tableau comparatif affiche tous postes : Brut vs Normalisé vs Δ
- [ ] Δ couleur: vert si 0%, orange si 0.1%-10%, rouge si >10%
- [ ] Clicks ligne impactée scrolls to adjustments
- [ ] Adjustments list affiche tous retraitements numérotés
- [ ] Chaque ajustement: type, poste, avant/après, %, explication
- [ ] [Lancer Calcul Ratios] POST ratios/compute
- [ ] Succès: toast + status RATIOS_COMPUTED
- [ ] Erreur: toast rouge
- [ ] [Retour Financials]: navigate `/cases/{id}/financials`
- [ ] [Recalculer] (optionnel): POST normalize re-run

### Visuel & UX

- [ ] Header topbar clair avec badges et titre
- [ ] Tableau: striped alternée, hover effect
- [ ] Δ icons/colors évidents
- [ ] Adjustments list: numérotation claire
- [ ] Spacing/padding cohérent
- [ ] Responsive (table horizontale scrollable sur mobile)
- [ ] Icons Material corrects (check, warning, etc.)

### Performance

- [ ] Page load < 500ms (data fetched before component init)
- [ ] Tableau rendu < 200ms
- [ ] Click [Lancer Ratios]: spinner pendant 2-5s

### Accessibility

- [ ] Table ARIA-label + th scoping
- [ ] Button labels clairs
- [ ] Contraste couleurs >= 4.5:1
- [ ] Keyboard navigation (Tab, Enter)

---

## FICHIERS LIVRÉS À LA FIN DE CE PROMPT

1. `src/app/pages/normalization/normalization.component.ts`
2. `src/app/pages/normalization/normalization.component.html`
3. `src/app/pages/normalization/normalization.component.scss`
4. `src/app/pages/normalization/components/comparative-table.component.ts`
5. `src/app/pages/normalization/components/comparative-table.component.html`
6. `src/app/pages/normalization/components/comparative-table.component.scss`
7. `src/app/pages/normalization/components/adjustments-list.component.ts`
8. `src/app/pages/normalization/components/adjustments-list.component.html`
9. `src/app/pages/normalization/components/adjustments-list.component.scss`
10. `src/app/pages/normalization/components/accounting-standard-section.component.ts`
11. `src/app/pages/normalization/components/accounting-standard-section.component.html`
12. `src/app/pages/normalization/components/accounting-standard-section.component.scss`
13. `src/app/app.routes.ts` — modifié (route `/cases/:caseId/normalization`)
14. `src/app/services/case.service.ts` — modifié (getNormalizedFinancials, computeRatios)
15. `src/app/models/financial.model.ts` — modifié (FinancialStatementNormalizedSchema)

---

## NOTES TECHNIQUES

- **Currency Formatting** : `{{ value | currency:'USD' }}`
- **Percentage Delta** : `{{ ((normalized - original) / original * 100) | number:'1.1-1' }}%`
- **Color Logic** :
  - Δ = 0 → verde badge "—"
  - 0 < Δ < 10 → orange badge
  - Δ >= 10 → red badge
- **Hierarchical Indentation** : CSS padding-left basé sur level (actif courant = 0, sous-postes = 20px)
- **Read-Only** : page entière en lecture (pas d'inputs, juste display)
- **Table Scrolling** : mat-table avec sticky headers si > 10 lignes
- **Spinner** : mat-progress-spinner (diameter=50) + texte "Calcul en cours..."

---

**FIN P10 — BLOC 3 — Normalisation IFRS**

---

## RÉSUMÉ PHASE 2 (P6-P10)

### Architecture Générale

```
P6: Dashboard
   ├─ KPI Row (4 cards)
   ├─ Recent Cases Table
   ├─ Active Tensions
   └─ Convergence Chart (MCC vs IA)

P7: Case Creation (Stepper 4 steps)
   ├─ Step 1: Market Info + Groupement
   ├─ Step 2: Bidder (Search/Create)
   ├─ Step 3: Summary (READ-ONLY)
   └─ Step 4: Confirmation + POST

P8: Gate Documentaire (3 Columns)
   ├─ Col 1: Checklist Requis
   ├─ Col 2: Upload + Table Existants
   └─ Col 3: Décision Gate

P9: États Financiers (4 Tabs)
   ├─ Tab 1: Bilan Actif (auto-calc)
   ├─ Tab 2: Bilan Passif (auto-calc + balance check)
   ├─ Tab 3: Compte Résultat (auto-calc)
   ├─ Tab 4: TFT (auto-calc)
   └─ [Lancer Normalisation]

P10: Normalisation IFRS (READ-ONLY)
   ├─ Accounting Standard Section
   ├─ Comparative Table (Brut vs Normalisé)
   ├─ Adjustments List (7+ retraitements)
   └─ [Lancer Calcul Ratios]
```

### Data Flow

```
Dashboard (P6)
    ↓ [+ Nouveau]
CaseCreate (P7)
    ↓ [Créer] → POST cases → status=PENDING_GATE
Gate (P8)
    ↓ [Upload docs] + [Éval Gate] → is_passed=true
    ↓ [Sceller] → status=FINANCIAL_INPUT
Financials (P9)
    ↓ [Enregistrer exercice] → POST financials
    ↓ [Lancer Normalisation] → POST normalize → status=NORMALIZATION_DONE
Normalization (P10)
    ↓ [Lancer Ratios] → POST ratios/compute → status=RATIOS_COMPUTED
    ↓ (futur P11 : Scoring)
```

### MCC Rules Coverage

- **MCC-R1** : MCC unique source (visible tout au long, priorité visuelle)
- **MCC-R2** : IA ne remplace pas MCC (IA en tirets, disclaimer P6 graphique)
- **MCC-R3** : Disclaimer IA (future P11+)
- **MCC-R4** : MCC > IA hiérarchie (P6 graphique solide vs tirets)
- **MCC-R5** : Tensions MODERATE/SEVERE obligent commentaire (future P11)
- **MCC-R6** : Gate bloquant (P8 is_passed=true → P9 access)
- **MCC-R7** : Ratios on normalized (P10 → P11)

### Status Machine Coverage

```
DRAFT (P7 brouillon)
  ↓
PENDING_GATE (P7 création + P8)
  ↓
FINANCIAL_INPUT (P8 scellé + P9)
  ↓
NORMALIZATION_DONE (P9 normalisé + P10)
  ↓
RATIOS_COMPUTED (P10 ratios lancés)
  ↓
SCORING_DONE (future P11)
  ↓
... etc
```

---

**FINE DE P6-P10 — PHASE 2 PREMIÈRE MOITIÉ**
