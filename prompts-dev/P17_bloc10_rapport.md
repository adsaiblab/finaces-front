═══════════════════════════════════════════════════════════════════════════════
PROMPT 17 — BLOC 10 — Rapport Final + Export PDF/Excel
Dépend de : PROMPT 16 (Bloc 9 — Expert Review & Conclusion)
Peut être parallélisé avec : Aucun
═══════════════════════════════════════════════════════════════════════════════

## CONTEXTE

À la fin du flux FinaCES, après clôture du dossier (CLOSED), le rapport final est généré.
Il agrège TOUTES les données du dossier dans une vue READ-ONLY destinée à :

- Consultation par les analystes et parties prenantes
- Archivage documentaire
- Export en PDF (signature légale) et Excel (intégration BI/archivage)

Le rapport suit une structure standard de 14 sections (backend Python) enrichie
de graphiques, jauges, badges et tableaux interactifs (mais read-only).

Ce bloc marque la fin du flux décisionnel et le début de l'archivage / exécution contractuelle.

## RÈGLES MÉTIER APPLICABLES

**MCC-R1 — MCC = Sole Decision Authority**
Le rapport affiche le score MCC comme DÉFINITIF. Aucune modification possible.

**MCC-R2 — IA Ne Peut Pas Remplacer MCC**
La section "Scoring IA (Non Décisionnel)" est clairement séparée et marquée en gris.

**MCC-R3 — Disclaimer sur IA**
Inline dans la section IA: "Le scoring IA est un outil d'aide à la décision,
non décisionnel. Le score MCC reste l'unique source d'approbation."

**MCC-R4 — MCC > IA Visuellement**
Section MCC (gauche topbar): jauges plus grandes, couleurs saturées.
Section IA: gris/bleu pâle, jauges réduites, disclaimer proéminent.

**MCC-R7 — Ratios sur Normalized Uniquement**
Les ratios affichés dans le rapport doivent être issus de fiscal_year
avec is_normalized=true. Mentionner "Données normalisées" en footer.

**Status Check**
case.status must be CLOSED avant affichage du rapport.
Si DRAFT or PENDING_GATE → redirect to /cases/:id/workspace

**Rapport Structure (14 sections backend)**
Backend génère pre-rendered JSON avec 14 sections. Frontend doit les afficher
en READ-ONLY avec graphiques interactifs (D3/Chart.js).

## FICHIERS À CRÉER / MODIFIER

**Créer:**
- `src/app/features/cases/blocs/bloc-10-rapport/bloc-10-rapport.component.ts`
- `src/app/features/cases/blocs/bloc-10-rapport/bloc-10-rapport.component.html`
- `src/app/features/cases/blocs/bloc-10-rapport/bloc-10-rapport.component.scss`
- `src/app/features/cases/blocs/bloc-10-rapport/rapport.service.ts`
- `src/app/features/cases/blocs/bloc-10-rapport/export.service.ts` (PDF + Excel)
- `src/app/features/cases/blocs/bloc-10-rapport/rapport-grid/rapport-grid.component.ts|html|scss`
- `src/app/features/cases/blocs/bloc-10-rapport/rapport-metrics/rapport-metrics.component.ts|html|scss`

**Modifier:**
- `src/app/app.routes.ts` → route `/cases/:caseId/rapport`
- `src/app/app.routes.ts` → route `/cases/:caseId/rapport/pdf` (export)

**Dépendances réutilisables:**
- `finaces-score-gauge` (P4)
- `finaces-pillar-row` (P4)
- `finaces-tension-badge` (P14)
- `finaces-alert-box` (P4)
- Chart.js / D3.js pour graphiques interactifs

## SPÉCIFICATION TECHNIQUE COMPLÈTE

### Route & Accès

```
Route: /cases/:caseId/rapport
Method: GET (load rapport)
Roles: ANALYST, ADMIN, VIEWER (read-only)
Status Guard: case.status must be CLOSED
```

### Top Bar Actions

```
┌─────────────────────────────────────────────────────────────┐
│ {bidder_name} — RAPPORT FINAL                               │
│                                  [🖨️ Imprimer] [✉️ Email]    │
│                                  [📊 Export Excel] [📄 Export PDF] │
└─────────────────────────────────────────────────────────────┘

Iconographie:
- 🖨️ picture_as_pdf (material icon) → Click → Print dialog (window.print())
- ✉️ send (material icon) → Open email client (mailto:?subject=...&body=...)
- 📊 table_chart (material icon) → Export Excel via export.service.exportToExcel()
- 📄 picture_as_pdf (material icon) → Export PDF via backend route POST /export-pdf

Chaque bouton est un mat-icon-button avec matTooltip.
```

### Layout Principal — 6 Sections Principales

```
┌─ SECTION 1: SYNTHÈSE EXÉCUTIVE ────────────────────────────┐
│ Layout: 2 colonnes (desktop), 1 colonne (mobile)            │
│                                                              │
│ GAUCHE — Identité & Contexte:                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ SOUMISSIONNAIRE & CONTRAT                              │  │
│ │ Nom:               {bidder_name}                        │  │
│ │ Secteur:           {sector}                             │  │
│ │ Pays:              {country}                            │  │
│ │                                                        │  │
│ │ Marché / Contrat:                                       │  │
│ │ Montant:           {contract_value} {currency}         │  │
│ │ Durée:             {contract_months} mois               │  │
│ │ Objet:             {contract_description}               │  │
│ │                                                        │  │
│ │ ANALYSE                                                 │  │
│ │ Analyste:          {analyst_name}                       │  │
│ │ Date:              {analysis_date}                      │  │
│ │ Politique:         {policy_version}                     │  │
│ │ Statut:            CLOS ✅                               │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ DROITE — Décision & Score:                                  │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ DÉCISION FINALE                                        │  │
│ │ ┌──────────────────┐                                   │  │
│ │ │ Score MCC:       │                                   │  │
│ │ │ Jauges 120px     │  ← finaces-score-gauge            │  │
│ │ │ 3.2/5.0          │     readonly=true                 │  │
│ │ └──────────────────┘                                   │  │
│ │                                                        │  │
│ │ Classe Risque:     MODÉRÉ  [badge color=warning]       │  │
│ │ Tension:           MODÉRÉE [finaces-tension-badge]     │  │
│ │ Recommandation:    APPROUVÉ SOUS CONDITIONS [badge]    │  │
│ │ Décision Expert:   VALIDÉ AVEC RÉSERVES (🟡)           │  │
│ └────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘

┌─ SECTION 2: SCORES PAR PILIER ────────────────────────────┐
│ 5 lignes finaces-pillar-row (readonly=true)                │
│ - Liquidité:       score, gauge, color, trend             │
│ - Solvabilité:     score, gauge, color, trend             │
│ - Rentabilité:     score, gauge, color, trend             │
│ - Capacité:        score, gauge, color, trend             │
│ - Qualité:         score, gauge, color, trend             │
│                                                              │
│ Chaque row affiche:                                         │
│ • Nom pilier                                                │
│ • Score (0-5) en texte gros                                 │
│ • Jauge horizontale 200px                                   │
│ • Label (INSUFFISANT|FAIBLE|MODÉRÉ|FORT|TRÈS_FORT)        │
│ • Trend arrow (↑ ↓ →) avec %, si CAGR>0                    │
│ • Couleur: green → yellow → red                             │
└────────────────────────────────────────────────────────────┘

┌─ SECTION 3: SCORING IA (NON DÉCISIONNEL) ─────────────────┐
│ Layout: 2 sous-sections, gris clair bg                     │
│                                                              │
│ En-tête: smart_toy icon + disclaimer inline               │
│ "Le scoring IA est un outil d'aide à la décision,           │
│  non décisionnel. Le score MCC reste l'unique source        │
│  d'approbation."                                            │
│                                                              │
│ GAUCHE — Score & Métadonnées:                               │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ Score IA: 2.8/5.0                                     │  │
│ │ Jauges 100px (plus petit que MCC)                      │  │
│ │ PDIA*: 75.3% (probabilité de défaut IA)               │  │
│ │ Modèle: FinaCES-v2.1.0 (4-var Altman EM)             │  │
│ │ Trained: 2025-02-14                                    │  │
│ │ ROC-AUC train: 0.847                                   │  │
│ │ Tension IA: MODÉRÉE [badge blue]                       │  │
│ │ Magnitude: 3.2/5.0                                     │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ DROITE — Divergence Analyste:                               │
│ Si scoreIA ≠ scoreMCC:                                      │
│ │ ⚠️ Divergence détectée                                  │  │
│ │ Analyste a priorisé: [comment du MCC]                  │  │
│ │ Raison: {expert_interpretation_mcc.analyse_dynamique}   │  │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ Si scoreIA = scoreMCC:                                      │
│ │ ✅ Convergence MCC/IA                                   │  │
│ │ Les deux modèles s'accordent.                            │  │
│ └─────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘

┌─ SECTION 4: STRESS TEST & CAPACITÉ ────────────────────────┐
│ Layout: 2 colonnes (desktop)                               │
│                                                              │
│ GAUCHE — Exposure:                                          │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ ANALYSE DE STRESS                                      │  │
│ │ Exposition / CA: 45% (relative à cash flow)            │  │
│ │ Score Capacité: 3.5/5.0 [Jauges 100px]                │  │
│ │ Verdict: ROBUSTE (capacité ≥ exposition)               │  │
│ │                                                        │  │
│ │ 60 jours:  LIMITE [icon-warning] min: -45K€            │  │
│ │ 90 jours:  SOLVABLE [icon-check] min: +12K€            │  │
│ │                                                        │  │
│ │ Conclusion stress: Vulnérable à chocs court terme      │  │
│ │ mais gérable long terme.                               │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ DROITE — Ratios Clés (depuis normalisation):                │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ RATIOS CLÉS (Données normalisées)                      │  │
│ │ Current Ratio:     1.8 (trend: ↑ +0.3)                │  │
│ │ Debt/Equity:       0.95 (trend: ↓ -0.12)              │  │
│ │ Marge EBITDA:      6.2% (trend: → ±0.1%)              │  │
│ │ ROE:               12.5% (trend: ↑ +1.2%)             │  │
│ │ DSO:               62 jours (trend: ↓ -5j)             │  │
│ │                                                        │  │
│ │ Note: Tous les ratios sont issus de données            │  │
│ │ normalisées (exercice: FY2024).                        │  │
│ └────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘

┌─ SECTION 5: POINTS D'ATTENTION & RECOMMANDATIONS ──────────┐
│ Smart recommendations (JSON backend):                       │
│                                                              │
│ ⚠️  BFR Toxique Détecté (icon: warning)                     │
│     Impact: -45K€ sur exposition                             │
│     Recommandation: Contrôle des délais fournisseurs        │
│                                                              │
│ 🔴 Marge EBITDA < 5% (icon: trending_down)                  │
│     Impact: Sensibilité aux chocs opérationnels              │
│     Recommandation: Audit opérationnel demandé               │
│                                                              │
│ 🟡 DSO > 90 jours (icon: hourglass)                          │
│     Impact: Immobilisation cliente excessive                 │
│     Recommandation: Tightening de politique crédit           │
│                                                              │
│ Conditions d'engagement (depuis expert review):              │
│                                                              │
│ ✅ OBLIGATOIRES:                                            │
│    • Caution bancaire 10% de CA                              │
│    • Reporting trimestriel des cash flows                    │
│    • Plafond d'engagement: {contract_value}                 │
│                                                              │
│ • RECOMMANDÉES:                                              │
│    • Audit opérationnel avant démarrage                      │
│    • Clause de révision à +12 mois de CAF < 5%              │
└────────────────────────────────────────────────────────────┘

┌─ SECTION 6: ANALYSE DÉTAILLÉE PAR PILIER ──────────────────┐
│ (6a) Liquidité:                                              │
│      • Current Ratio trend chart (line chart, D3/Chart.js)  │
│      • BFR analysis avec breakdown (actif circulant, dettes)│
│      • Fonds de roulement évolution                          │
│      • Interprétation experte textuelle                      │
│                                                              │
│ (6b) Solvabilité:                                            │
│      • Debt/Equity evolution (bar chart)                     │
│      • Gearing ratios                                        │
│      • Coverage ratios (EBITDA/Interest, si applicable)      │
│      • Interprétation experte textuelle                      │
│                                                              │
│ (6c) Rentabilité:                                            │
│      • Marge nette, EBITDA margin trends (line/bar)         │
│      • ROE/ROA comparison (bar chart)                        │
│      • Profitability analysis text                           │
│                                                              │
│ (6d) Capacité:                                               │
│      • CAF timeline (bar chart)                              │
│      • Stress test results (min cash by scenario)            │
│      • Coverage conclusion (capacity vs exposure)            │
│                                                              │
│ (6e) Qualité:                                                │
│      • Audit findings summary (text)                         │
│      • Governance assessment                                 │
│      • Control environment notes                             │
│                                                              │
│ (6f) Dynamique Multi-Exercices:                              │
│      • CAGR summary (Liquidité, Solvabilité, Rentabilité)   │
│      • Cross-pillar patterns (si détectés): FAUSSE_LIQUIDITE,│
│        SURLEVIER_MASQUE, BFR_TOXIQUE, EFFET_CISEAUX         │
│      • Trends interpretation                                 │
│                                                              │
│ Note: Chaque sous-section affiche:                           │
│  - Graphique interactif (click → zoom, hover → valeurs)      │
│  - Texte analytique (backend rapport_sections[6])            │
│  - Benchmark/normes sectorielles (si applicables)            │
└────────────────────────────────────────────────────────────┘
```

### Sections Restantes (Backend Pre-rendered)

Les sections 7-14 sont des narratives pré-générées par le backend (rapport_sections JSON).
Frontend les affiche en READ-ONLY avec mise en forme simple (headers, lists, bold):

```
7.  Méthodologie & Ratios (expliquer Z-Score, sources, normalisations)
8.  Analyse IA & Modèles (disclaimer, SHAP, feature importance)
9.  Atténuants & Contexte (facteurs compensatoires, secteur, stratégie)
10. Synthèse Décisionnelle (récapitulation du workflow MCC vs IA)
11. Appréciation Finale (jugement qualitatif expert)
12. Recommandations Contractuelles (conditions, clauses, suivi)
13. Limites & Réserves (documented concerns, audit findings non résolus)
14. Conclusion & Signature Analyste (synthèse exécutive + nom/date/signature)
```

### Export PDF

**Déclenchement:**
- Click bouton [Export PDF]
- POST `/api/v1/cases/{caseId}/export-pdf`
- Backend: python export.py → PDF avec en-tête MCC logo, footer "Confidentiel"
- Response: {url: "s3://bucket/exports/case-{id}-{timestamp}.pdf", expires_in_hours: 24}
- Frontend: window.open(url) ou téléchargement direct

**Contenu PDF:**
- Page 1: Couverture (logo, titre, soumissionnaire, date, classification)
- Page 2: TOC (table of contents)
- Pages 3+: Toutes les sections ci-dessus, mis en page (1 col, marges 2cm)
- Graphiques: exportés en PNG intégré
- Dernière page: Signature analyste (champ vide pour signature manuscrite post-print)

### Export Excel

**Déclenchement:**
- Click bouton [Export Excel]
- Client-side via export.service.exportToExcel(caseData)
- ou POST `/api/v1/cases/{caseId}/export-excel` (backend option)

**Structure Sheets:**

1. **Synthèse** (1 sheet):
   - Colonne A: Étiquettes (Soumissionnaire, Secteur, Montant, etc.)
   - Colonne B: Valeurs
   - Lignes 12+: Score MCC, Classes risque, Tension, Recommandation

2. **Scores Piliers** (1 sheet):
   - Colonne: Pilier | Score | Label | Trend | Commentaire
   - 5 lignes (liquidité, solvabilité, rentabilité, capacité, qualité)

3. **Ratios Financiers** (1 sheet):
   - Colonne: Ratio | FY-2 | FY-1 | FY0 | Moyenne | Norme
   - Toutes les 25+ ratios (depuis read_financial_ratios)

4. **Stress Test** (1 sheet):
   - Colonnes: Scénario | Status | Min Cash | Conclusion
   - Lignes: 60d, 90d, custom scenarios

5. **Scoring IA** (1 sheet):
   - Score IA, PDIA%, modèle, ROC-AUC, divergence MCC
   - Feature importance (top 20)

6. **Conditions** (1 sheet):
   - Colonne: Type | Description | Importance | Due Date | Status

**Format Excel:**
- Font: Calibri 11pt
- Headers: gras, bg-color=primary
- Alternating row colors (zebra striping)
- Autofit column widths
- Freeze panes row 1
- Filename: `{bidder_name}_{caseId}_{export_date}.xlsx`

## CONTRAINTES ANGULAR

**Component Architecture:**
- Main component: Bloc10RapportComponent (OnInit, ChangeDetectionStrategy.OnPush)
- Sub-components:
  - RapportGridComponent (layout for charts/tables)
  - RapportMetricsComponent (displays KPIs)
  - Chart.js / D3.js integration via directives or services

**State Management:**
- CaseService.getCaseById(caseId) → load full case data
- RapportService.getRapportSections(caseId) → GET /api/v1/cases/{caseId}/rapport-sections
- ExportService.exportToPDF(caseId) → trigger backend export
- ExportService.exportToExcel(caseData) → client-side XLSX generation (sheetjs library)

**Third-Party Libraries:**
- `sheetjs` (xlsx): for Excel export client-side
- `pdfkit` or backend PDF service: for PDF generation
- `chart.js` or `d3.js`: for financial charts
- `print-css`: handle print media (@media print)

**Change Detection:**
- OnPush strategy (load data once, no polling)
- Pipes for number/currency formatting

**Accessibility:**
- Semantic HTML (sections, headers, tables with caption)
- aria-labels on charts
- Keyboard navigation on interactive charts
- Print-friendly CSS (hide buttons, adjust colors)

**Print Media:**
```scss
@media print {
  .topbar-actions { display: none; }
  .rapport-content { width: 100%; margin: 0; }
  .chart { page-break-inside: avoid; }
  page-break-after: always; (after sections)
}
```

## BINDING API

### GET Full Rapport Data
```
GET /api/v1/cases/{caseId}
→ CaseDetailDTO {
    id, bidder_name, sector, country, contract_value, contract_months,
    mcc_score_final, risk_class, tension_label, tension_magnitude,
    ia_score, ia_pdia, ia_model_version,
    stress_test_results: {stress_60d, stress_90d},
    system_alerts, smart_recommendations,
    expert_review: {qualitative_notes, final_decision, conditions, conclusion},
    analyst_id, analysis_date,
    updated_at
  }
```

### GET Rapport Sections (narrative content)
```
GET /api/v1/cases/{caseId}/rapport-sections
→ RapportSectionsDTO {
    sections: [
      {key: "01", title: "Infos", content: "..."},
      {key: "02", title: "Objectif", content: "..."},
      ...
      {key: "14", title: "Conclusion", content: "..."}
    ]
  }
```

### GET Financial Ratios (for excel/charts)
```
GET /api/v1/cases/{caseId}/financial-ratios
→ array of RatioByYearDTO {
    fiscal_year, current_ratio, debt_to_equity, marge_nette,
    ebitda_margin, roa, roe, cagr_values, ...
  }
```

### POST Export to PDF
```
POST /api/v1/cases/{caseId}/export-pdf
Response: {url: "s3://...", expires_in_hours: 24}
```

### POST Export to Excel
```
POST /api/v1/cases/{caseId}/export-excel (optional backend)
or Client-side: sheetjs.utils.book_new() → XLSX.writeFile()
```

## CRITÈRES DE VALIDATION

### Validation UI
1. ✅ case.status === 'CLOSED' ou redirect to /cases/:id/workspace
2. ✅ Tous les scorecard data chargés avant rendu (no partial rendering)
3. ✅ Graphiques Chart.js/D3 responsive (redraw on window resize)
4. ✅ Export buttons disabled pendant traitement (disabled state + spinner)
5. ✅ Toast success après export ("Fichier prêt à télécharger")
6. ✅ All sections rendered (aucune section manquante)
7. ✅ readonly=true sur tous les finaces-pillar-row

### Validation Data Integrity
1. ✅ Ratios dans les charts/tableaux sont "normalized" (is_normalized=true)
2. ✅ Trends affichent le CAGR correct (from read_trends_analysis)
3. ✅ Stress test statuses mappent correctement (SOLVENT→check, LIMIT→warning, INSOLVENT→error)
4. ✅ Divergence MCC/IA détectée et affichée si |scoreMCC - scoreIA| > 0.5
5. ✅ Conditions list complète (tous les items depuis expert review)

### Validation Export
1. ✅ PDF contient logo MCC, en-têtes, pieds de page
2. ✅ PDF est "confidentiel" (mention en footer)
3. ✅ Excel a 6 sheets correctement nommées et formatées
4. ✅ Numbers dans Excel formatés (currency 2 decimals, percentages avec %)
5. ✅ Exports ne contiennent PAS de données confidentielles inattendues (analyste ID ok, tokens NON)
6. ✅ File names follow convention: {bidder}_{caseId}_{date}

### Validation API Error Handling
1. ✅ 401 Unauthorized → redirect to /auth/login
2. ✅ 404 Not Found (case inexistant) → finaces-alert-box error + back button
3. ✅ 403 Forbidden (case not CLOSED) → finaces-alert-box + info pour analyste
4. ✅ 500 Server Error (PDF gen fails) → toast error + retry button
5. ✅ Network timeout on export → user-friendly message + retry

## FICHIERS LIVRÉS À LA FIN DE CE PROMPT

1. **src/app/features/cases/blocs/bloc-10-rapport/bloc-10-rapport.component.ts**
   - Component class: ngOnInit(), loadCase(), loadSections()
   - exportToPDF(), exportToExcel() methods
   - Error handling, loading states
   - ChangeDetectionStrategy.OnPush

2. **src/app/features/cases/blocs/bloc-10-rapport/bloc-10-rapport.component.html**
   - Full template with topbar actions (print, email, export buttons)
   - 6 main sections (executive summary, pillars, IA, stress, alerts, detailed)
   - finaces-score-gauge (readonly), finaces-pillar-row (readonly)
   - Chart containers (div ids for D3/Chart.js rendering)
   - Conditional sections (IA disclaimer, stress results)
   - Print-friendly layout

3. **src/app/features/cases/blocs/bloc-10-rapport/bloc-10-rapport.component.scss**
   - Print media queries (@media print)
   - Two-column layout (desktop) → single column (mobile)
   - Chart sizing (responsive containers)
   - Section spacing, borders, backgrounds
   - Alert/badge styling

4. **src/app/features/cases/blocs/bloc-10-rapport/rapport.service.ts**
   - HttpClient wrappers
   - getRapportSections(caseId): Observable<RapportSectionsDTO>
   - getFinancialRatios(caseId): Observable<RatioByYearDTO[]>
   - Error interceptor integration

5. **src/app/features/cases/blocs/bloc-10-rapport/export.service.ts**
   - exportToPDF(caseId): Observable<{url, expires_in_hours}>
   - exportToExcel(caseData, ratios): void (client-side, uses sheetjs)
   - PDF post-processing (logo embedding if needed)
   - Excel sheet creation utilities

6. **src/app/features/cases/blocs/bloc-10-rapport/rapport-grid/rapport-grid.component.ts|html|scss**
   - Reusable component for 2-col sections
   - Responsive: 2 col desktop → 1 col mobile
   - Used in synthèse, stress sections

7. **src/app/features/cases/blocs/bloc-10-rapport/rapport-metrics/rapport-metrics.component.ts|html|scss**
   - Displays ratio KPIs (current ratio, debt/equity, margins)
   - Table or card layout
   - Trend indicators (↑ ↓ →)

8. **app.routes.ts update**
   - Route: `/cases/:caseId/rapport`
   - Component: Bloc10RapportComponent
   - Guards: [CaseStatusGuard, AuthGuard]
   - Data: {requiredStatuses: ['CLOSED']}

---

## CHECKPOINT PHASE 3 ─────────────────────────────────────

À ce stade, l'application doit :

✅ Permettre la revue expert complète avec notes, override, décision, recommandations
✅ Afficher le rapport final complet en lecture seule
✅ Exporter en PDF (via backend) et Excel (client-side ou backend)
✅ Clôturer un dossier (CLOSED)
✅ Avoir un flux complet de bout en bout :
   création → gate → financials → normalization → ratios → scoring → IA → tension →
   stress → expert → rapport
✅ Affichage de diagrammes financiers interactifs (Chart.js/D3)
✅ Gestion d'erreurs complète (401, 404, 500, timeouts)
✅ Impression et export PDF/Excel fonctionnels

─────────────────────────────────────────────────────────────

