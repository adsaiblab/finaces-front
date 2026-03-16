═══════════════════════════════════════════════════════════════════════════════
PROMPT 16 — BLOC 9 — Expert Review & Conclusion
Dépend de : PROMPT 15 (Bloc 8 — Stress Test Results)
Peut être parallélisé avec : Aucun
═══════════════════════════════════════════════════════════════════════════════

## CONTEXTE

À la fin du flux FinaCES, après que le scoring MCC, la tension IA et le stress test sont complétés,
un analyste expert (ROLE=ANALYST ou ADMIN) accède au bloc "Revue Experte" pour :

1. Consulter le récapitulatif décisionnel (score final, classe risque, tension, stress results)
2. Saisir des notes qualitatives libres
3. Optionnellement appliquer un override manuel du risque
4. Décider de la validation finale (VALIDATED, VALIDATED_WITH_RESERVES, REJECTED, PENDING_INVESTIGATION)
5. Ajouter des conditions et recommandations MCC obligatoires
6. Rédiger une conclusion finale avant clôture du dossier

Ce bloc marque la transition vers le rapport final (P17). C'est la dernière opportunité de
correction avant publication du rapport et clôture du dossier.

## RÈGLES MÉTIER APPLICABLES

**MCC-R1 — MCC = Sole Decision Authority**
Le score MCC est DÉFINITIF. L'override ne peut qu'ajuster la classe risque, jamais le score luimême.
Override permet un déplacement max ±1 classe risque.

**MCC-R3 — Disclaimer sur IA**
Sur toute mention du score IA → afficher disclaimer: "Le scoring IA est un outil d'aide à la décision,
non décisionnel. Le score MCC reste l'unique source d'approbation."

**MCC-R5 — Tension MODÉRÉ/GRAVE = Commentaire Obligatoire**
Si tension_label in (MODERATE, SEVERE) → champ qualitative_notes REQUIRED et doit contenir ≥50 caractères
mentionnant explicitement la nature de la tension.

**MCC-R6 — Gate Check Before Financials**
Avant d'accéder au bloc expert, vérifier case.status in (STRESS_DONE, EXPERT_REVIEWED, CLOSED).
Sinon → 404 ou redirect.

**Status Workflow**
Transition: STRESS_DONE → EXPERT_REVIEWED (après POST review) → CLOSED (après PATCH conclusion + clôture).

## FICHIERS À CRÉER / MODIFIER

**Créer:**
- `src/app/features/cases/blocs/bloc-9-expert/bloc-9-expert.component.ts`
- `src/app/features/cases/blocs/bloc-9-expert/bloc-9-expert.component.html`
- `src/app/features/cases/blocs/bloc-9-expert/bloc-9-expert.component.scss`
- `src/app/features/cases/blocs/bloc-9-expert/expert-review.service.ts`

**Modifier:**
- `src/app/app.routes.ts` → route `/cases/:caseId/expert`

**Dépendances réutilisables:**
- `finaces-score-gauge` (P4)
- `finaces-pillar-row` (P4)
- `finaces-tension-badge` (P14)
- `finaces-alert-box` (P4)

## SPÉCIFICATION TECHNIQUE COMPLÈTE

### Route & Accès
```
Route: /cases/:caseId/expert
Method: GET (load case), POST (review), PATCH (conclusion)
Roles: ANALYST, ADMIN
```

### Layout Principal

```
┌─────────────────────────────────────────────────────────────┐
│ EXPERT REVIEW — {bidder_name}                   [← Retour] │
│ Badge: REVUE EXPERTE | Analyst: {current_user.name}        │
└─────────────────────────────────────────────────────────────┘

┌─ SECTION 1: RECAP DÉCISIONNEL ──────────────────────────────┐
│ Layout: 2 colonnes (desktop), 1 colonne (mobile)            │
│                                                              │
│ Gauche (Scores & Statuts):                                  │
│ ┌──────────────────────────┐                                │
│ │ Score MCC: 3.2/5.0       │  ← finaces-score-gauge         │
│ │ Classe: MODÉRÉ           │  ← Badge avec icône            │
│ │ Tension: MODÉRÉE         │  ← finaces-tension-badge       │
│ │ Override: Appliqué       │  ← Icon warning si présent      │
│ └──────────────────────────┘                                │
│                                                              │
│ Droite (Stress & Attention):                                │
│ • Stress 60j: LIMITE (solde: -45K€)  [icon-alert]          │
│ • Stress 90j: SOLVABLE (solde: +12K€) [icon-check]         │
│ • Points d'attention critiques:                             │
│   - BFR toxique détecté                                     │
│   - Marge EBITDA < 5%                                       │
│   - Dso > 90j                                               │
└────────────────────────────────────────────────────────────┘

┌─ SECTION 2: NOTES QUALITATIVES ────────────────────────────┐
│ [Label] Analyse qualitative de l'expert                     │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ mat-form-field textarea                                │  │
│ │ rows=6                                                 │  │
│ │ required                                               │  │
│ │ placeholder="Synthèse des points clés..."              │  │
│ │ [formControl]="qualitativeNotesCtrl"                   │  │
│ │                                                        │  │
│ │ Aide: Faire référence aux ratios, tensions, stress,    │  │
│ │ points d'attention système et justifier la décision.   │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ⚠️ Si tension in (MODERATE, SEVERE):                        │
│    "Obligatoire — Veuillez commenter la tension détectée"  │
└────────────────────────────────────────────────────────────┘

┌─ SECTION 3: OVERRIDE MANUEL (OPTIONNEL) ──────────────────┐
│ [Label] Ajustement manuel de la classe de risque           │
│ [Aide] "L'override permet une correction max ±1 classe"    │
│                                                              │
│ Classe actuelle: MODÉRÉ → mat-select                       │
│ Options: [AUCUN] [FAIBLE] [MODÉRÉ] [ÉLEVÉ] [CRITIQUE]     │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ ⚠️ ATTENTION: Tout override doit être justifié dans    │  │
│ │ les notes qualitatives ci-dessus.                      │  │
│ │ Audit trail: Toute modification est tracée.            │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ Si override changé:                                          │
│  • Classe finale recalculée                                 │
│  • Icône warning en rouge                                   │
│  • Bouton [Réinitialiser override] visible                  │
└────────────────────────────────────────────────────────────┘

┌─ SECTION 4: DÉCISION FINALE ──────────────────────────────┐
│ [Label] Validation du dossier                              │
│                                                              │
│ ⊕ VALIDÉ (✅)                                               │
│   Approval direct sans réserves                             │
│   → cas: "Approuvé pour engagement"                         │
│                                                              │
│ ⊕ VALIDÉ AVEC RÉSERVES (🟡)                                │
│   Approval conditionné à des mesures additionnelles         │
│   → cas: "Approuvé sous conditions"                         │
│                                                              │
│ ⊕ REJETÉ (🔴)                                               │
│   Refusal: risque inacceptable                              │
│   → cas: "Engagement recommandé impossible"                 │
│                                                              │
│ ⊕ EN ATTENTE D'INVESTIGATION (🔵)                           │
│   Eléments à clarifier avant décision finale                │
│   → cas: "Demander documents complémentaires"               │
│                                                              │
│ [Radio group] [formControl]="decisionCtrl"                 │
│ Required                                                     │
│                                                              │
│ ⚠️ Si REJETÉ ou EN ATTENTE:                                 │
│    Champ textarea "Raison / Clarifications demandées"       │
│    becomes REQUIRED (rows=4)                                │
└────────────────────────────────────────────────────────────┘

┌─ SECTION 5: RECOMMANDATIONS MCC ──────────────────────────┐
│ [Label] Conditions et recommandations d'engagement          │
│ Affichage: List dynamique, éditable                        │
│                                                              │
│ Conditions pré-remplies (depuis scoring MCC):               │
│ ☑ Caution bancaire 10% de CA                               │
│ ☑ Reporting trimestriel                                    │
│                                                              │
│ [+ Ajouter une condition]                                   │
│  ↓                                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Dialog: Nouvelle condition                          │   │
│  │ [Type] mat-select: CAUTION | REPORTING | PLAFOND    │   │
│  │        | CLAUSE_REVISION | AUDIT | AUTRE            │   │
│  │ [Description] mat-form-field textarea rows=3        │   │
│  │ [Importance] radio: OBLIGATOIRE / RECOMMANDÉE       │   │
│  │ [Échéance] mat-form-field date (optional)           │   │
│  │ [Boutons] [Ajouter] [Annuler]                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│ Chaque condition:                                            │
│  • Type badge (color=primary/accent/warn)                   │
│  • Description text                                         │
│  • ✅ si OBLIGATOIRE, • si RECOMMANDÉE                      │
│  • [Modifier] [Supprimer]                                   │
│                                                              │
│ POST API: /api/v1/cases/{id}/recommendation                │
│ Body: {conditions: [...], notes: "..."}                     │
└────────────────────────────────────────────────────────────┘

┌─ SECTION 6: CONCLUSION FINALE ────────────────────────────┐
│ [Label] Conclusion et synthèse finale                       │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ mat-form-field textarea                                │  │
│ │ rows=4                                                 │  │
│ │ required                                               │  │
│ │ placeholder="Synthèse exécutive pour rapport final..." │  │
│ │ [formControl]="conclusionCtrl"                         │  │
│ │                                                        │  │
│ │ Aide: Texte qui figurera dans le rapport final,       │  │
│ │ chapitre "Conclusion de l'analyste"                    │  │
│ └────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘

┌─ SECTION 7: ACTIONS FINALES ──────────────────────────────┐
│ [Modifier]                           [Soumettre la revue expert]
│                                      [Clôturer le dossier →
│                                       Rapport Final] (disabled)
│                                                              │
│ Bouton [Modifier]: Reset form, retour à édition             │
│ Bouton [Soumettre]:                                         │
│   - POST /api/v1/cases/{id}/experts/review                  │
│   - Payload: {                                              │
│       qualitative_notes: "...",                             │
│       manual_risk_override: "AUCUN|FAIBLE|...",             │
│       final_decision: "VALIDATED|...",                      │
│       rejection_reason: "..." (si REJETÉ/EN ATTENTE),       │
│       conditions: [...],                                    │
│       conclusion: "..."                                     │
│     }                                                       │
│   - Si succès: status → EXPERT_REVIEWED, toast success      │
│   - Form becomes read-only                                  │
│   - Bouton [Clôturer] becomes ENABLED                       │
│                                                              │
│ Bouton [Clôturer le dossier → Rapport Final]:               │
│   - DISABLED jusqu'à review submitted                       │
│   - Ouvre dialog confirmation:                              │
│     "Êtes-vous certain? Le dossier passera en CLOSED et     │
│      le rapport sera définitif."                            │
│   - PATCH /api/v1/cases/{id}                                │
│     {status: "CLOSED", updated_by: current_user_id}         │
│   - Si succès: navigate(/cases/:id/rapport) avec toast      │
└────────────────────────────────────────────────────────────┘
```

### ExpertReviewInputSchema (Backend)
```typescript
{
  case_id: UUID,
  qualitative_notes: string (min: 50 si tension MODERATE/SEVERE, max: 2000),
  manual_risk_override?: "AUCUN" | "FAIBLE" | "MODÉRÉ" | "ÉLEVÉ" | "CRITIQUE",
  final_decision: "VALIDATED" | "VALIDATED_WITH_RESERVES" | "REJECTED" | "PENDING_INVESTIGATION",
  rejection_reason?: string (required si REJETÉ or EN ATTENTE, min: 30 chars),
  conditions: [
    {
      type: "CAUTION" | "REPORTING" | "PLAFOND" | "CLAUSE_REVISION" | "AUDIT" | "AUTRE",
      description: string (min: 20, max: 500),
      importance: "OBLIGATOIRE" | "RECOMMANDÉE",
      due_date?: ISO date
    }
  ],
  conclusion: string (min: 100, max: 3000)
}
```

### ExpertReviewOutputSchema (Backend Response)
```typescript
{
  id: UUID,
  case_id: UUID,
  reviewer_id: UUID,
  submitted_at: ISO timestamp,
  qualitative_notes: string,
  manual_risk_override: string | null,
  final_decision: string,
  rejection_reason?: string,
  conditions: [...],
  conclusion: string,
  case_updated: {
    status: "EXPERT_REVIEWED",
    risk_class_final: string,
    final_decision: string,
    override_applied: boolean
  }
}
```

### Récap Décisionnel — Données Sources

Récupérer depuis `GET /api/v1/cases/{id}`:
- `mcc_score_final`: number (0-5)
- `risk_class`: string (FAIBLE|MODÉRÉ|ÉLEVÉ|CRITIQUE)
- `tension_label`: string (NONE|LIGHT|MODERATE|SEVERE)
- `tension_magnitude`: number (0-5)
- `stress_test_results`: {
    stress_60d: {status: "SOLVENT|LIMIT|INSOLVENT", min_cash: number},
    stress_90d: {status: "SOLVENT|LIMIT|INSOLVENT", min_cash: number}
  }
- `override_applied`: boolean
- `override_type`: string | null
- `system_alerts`: string[] (smart_recommendations)

## CONTRAINTES ANGULAR

**Formulaires:**
- Réactive Forms (FormBuilder)
- Validateurs: required, minLength, pattern si besoin
- Conditional validators: si tension MODERATE/SEVERE → qualitativeNotes.required

**State Management:**
- CaseService.getCaseById(caseId) → Observable<CaseDetailDTO>
- ExpertReviewService.submitReview(caseId, payload) → Observable<ExpertReviewOutputSchema>
- CaseService.updateCaseStatus(caseId, status) → Observable<CaseDetailDTO>
- Reset après succès de review: form.disable() ou form.markAsPristine()

**Navigation & Guards:**
- CaseStatusGuard: case.status must be STRESS_DONE or EXPERT_REVIEWED
- AuthGuard: roles ANALYST or ADMIN required
- Après clôture: navigate(/cases/:id/rapport)

**Change Detection:**
- ChangeDetectionStrategy.OnPush
- Angular Material ripple, icon binding, mat-error directives

**Accessibility:**
- Labels liées aux inputs via matFormField + formControlName
- ARIA roles sur sections
- Keyboard navigation sur radio/select

## BINDING API

### GET Case (load page)
```
GET /api/v1/cases/{caseId}
→ CaseDetailDTO {
    id, bidder_name, status, mcc_score_final, risk_class, tension_label,
    stress_test_results, override_applied, system_alerts, ...
  }
```

### POST Expert Review
```
POST /api/v1/cases/{caseId}/experts/review
Request: ExpertReviewInputSchema
Response: ExpertReviewOutputSchema {
  id, case_id, final_decision, case_updated: {status: EXPERT_REVIEWED}
}
```

### POST Recommendations
```
POST /api/v1/cases/{caseId}/recommendation
Request: {conditions: [...], notes: string}
Response: {id, conditions, created_at}
```

### PATCH Case Conclusion & Close
```
PATCH /api/v1/cases/{caseId}
Request: {status: "CLOSED", updated_by: analyst_id}
Response: CaseDetailDTO {status: CLOSED, ...}
```

## CRITÈRES DE VALIDATION

### Validation Métier
1. ✅ Si tension in (MODERATE, SEVERE): qualitative_notes REQUIRED et ≥50 chars
2. ✅ Override appliqué: must include justification dans notes (keyword check ou just ensure notes non-empty)
3. ✅ final_decision in ENUM: VALIDATED, VALIDATED_WITH_RESERVES, REJECTED, PENDING_INVESTIGATION
4. ✅ Si REJETÉ or EN ATTENTE: rejection_reason REQUIRED et ≥30 chars
5. ✅ conclusion REQUIRED, ≥100 chars
6. ✅ Conditions: at least 1 condition must be present OR qualitative_notes must mention justification
7. ✅ case.status doit être STRESS_DONE or EXPERT_REVIEWED avant accès

### Validation UI
1. ✅ Form disabled après submit jusqu'à [Modifier] cliqué
2. ✅ Bouton [Clôturer] DISABLED tant que form not submitted
3. ✅ Mat-error affichés sous chaque champ invalide
4. ✅ Toast success après POST review avec message "Revue experte soumise"
5. ✅ Toast success après PATCH close avec redirection vers rapport

### Validation API
1. ✅ 400 Bad Request si validation fails → afficher erreur dans finaces-alert-box
2. ✅ 401 Unauthorized → redirect to /auth/login
3. ✅ 404 Not Found (case inexistant) → afficher alert rouge
5. ✅ 500 Server Error → afficher alert rouge + retry button

## FICHIERS LIVRÉS À LA FIN DE CE PROMPT

1. **src/app/features/cases/blocs/bloc-9-expert/bloc-9-expert.component.ts**
   - Component class avec FormGroup, API calls
   - submitReview(), closeCase(), resetForm() methods
   - validation logique
   - error handling

2. **src/app/features/cases/blocs/bloc-9-expert/bloc-9-expert.component.html**
   - Full template avec 7 sections décrites
   - FormGroup binding, mat-form-field, textarea, radio, select, buttons
   - finaces-score-gauge, finaces-tension-badge imports
   - Conditional rendering: override, rejection_reason, pilot mode
   - Conditions list avec [+ Ajouter] dialog

3. **src/app/features/cases/blocs/bloc-9-expert/bloc-9-expert.component.scss**
   - Responsive layout (2 col desktop → 1 col mobile)
   - Alert box styling (warn/error states)
   - Section dividers, padding
   - Button group styling

4. **src/app/features/cases/blocs/bloc-9-expert/expert-review.service.ts**
   - HttpClient wrappers
   - submitReview(caseId, payload): Observable<ExpertReviewOutputSchema>
   - addCondition(caseId, condition): Observable
   - Error interceptor integration

5. **app.routes.ts update**
   - Route: `/cases/:caseId/expert`
   - Component: Bloc9ExpertComponent
   - Guards: [CaseStatusGuard, AuthGuard]
   - Data: {requiredStatuses: ['STRESS_DONE', 'EXPERT_REVIEWED']}

