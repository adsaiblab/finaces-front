═══════════════════════════════════════════════════════════════════════════════
PROMPT 18 — BLOC CONSORTIUM (ConsortiumScorecardOutput + weak link + membres)
Dépend de : PROMPT 12 (Bloc 6 — Scoring MCC)
Peut être parallélisé avec : PROMPT 19 (Bloc Admin IA)
═══════════════════════════════════════════════════════════════════════════════

## CONTEXTE

FinaCES supporte les dossiers de type GROUPEMENT (consortium/JV = Joint Venture).
Un consortium est composé de plusieurs entreprises (MANDATAIRE + COTRAITANTS) avec
une participation % chacun et une structure juridique définie (SOLIDAIRE, CONJOINTE, SEPARATE).

Le scoring MCC pour un GROUPEMENT suit une logique AGGREGATION différente du SINGLE:
- Scores individuels pour chaque membre
- Score pondéré via weighted average (par participation %)
- WEAK LINK DETECTION: si un membre a un score << moyenne, dégradation automatique
- SYNERGY INDEX: potentiel d'amélioration via collaboration
- FINAL RISK CLASS peut être dégradée si weak link ou structure JV risky

Ce bloc se déclenche APRÈS scoring MCC individuel de tous les membres
et AVANT le bloc Stress Test (P15). C'est une extension du bloc Scoring MCC (P12).

## RÈGLES MÉTIER APPLICABLES

**Consortium-Specific Rules:**

1. **Aggregation Method (JV Type):**
   - SOLIDAIRE: weighted average (plus de risque partagé)
   - CONJOINTE: weighted average + synergy bonus (collaboration étroite)
   - SEPARATE: max(scores) (solidarité limitée, chacun responsable de sa part)

2. **Weak Link Detection:**
   - Si scoreMin < (average - 1.5) → weak_link_triggered = true
   - weak_link_member = membre avec score min
   - Alerte OBLIGATOIRE: "Maillon faible détecté: {name} (score {score})"
   - Impact: risk_class peut être dégradée d'une classe

3. **Synergy Index (0-1.0):**
   - Basé sur complémentarités sectorielles, diversification géographique, synergie opérationnelle
   - Backend calcule (formula TBD avec CFO MCC)
   - Si synergy_index > 0.7 → synergy_bonus = +0.3 au score final (cap 5.0)

4. **Leader Blocking:**
   - Si mandataire score < 1.5 (CRITIQUE) → leader_blocking = true
   - Même si autre cotraitants bons: consortium cannot proceed
   - Alerte CRITIQUE: "Leader non viable — réévaluation requise"

5. **MCC-R1 — MCC = Sole Decision:**
   Scoring consortium aussi décisionnel que scoring single. Pas d'override IA.

6. **MCC-R6 — Gate Check:**
   Avant scoring consortium, vérifier tous les membres ont status ≥ FINANCIAL_INPUT.
   Sinon: notification "En attente de données membres"

## FICHIERS À CRÉER / MODIFIER

**Créer:**
- `src/app/features/cases/blocs/bloc-12-consortium/bloc-12-consortium.component.ts`
- `src/app/features/cases/blocs/bloc-12-consortium/bloc-12-consortium.component.html`
- `src/app/features/cases/blocs/bloc-12-consortium/bloc-12-consortium.component.scss`
- `src/app/features/cases/blocs/bloc-12-consortium/consortium.service.ts`
- `src/app/features/cases/blocs/bloc-12-consortium/consortium-member-dialog.component.ts|html`

**Modifier:**
- `src/app/app.routes.ts` → route `/cases/:caseId/consortium`
- PROMPT 12 (Bloc 6 Scoring) template: ajouter lien [Gérer Consortium] si type=GROUPEMENT

**Dépendances réutilisables:**
- `finaces-score-gauge` (P4)
- `finaces-alert-box` (P4)
- `finaces-pillar-row` (P4, pour scores membres)

## SPÉCIFICATION TECHNIQUE COMPLÈTE

### Route & Accès

```
Route: /cases/:caseId/consortium
Method: GET (load consortium data), POST (add member), DELETE (remove member)
Roles: ANALYST, ADMIN
Activation: Only if case.case_type = 'GROUPEMENT'
```

### Layout Principal

```
┌─────────────────────────────────────────────────────────────┐
│ CONSORTIUM — {bidder_name}                       [← Retour] │
│ Type de JV: CONJOINTE | Synergy Index: 0.78                │
└─────────────────────────────────────────────────────────────┘

┌─ SECTION 1: SYNTHÈSE CONSORTIUM ───────────────────────────┐
│ Layout: 2 colonnes (desktop), 1 colonne (mobile)            │
│                                                              │
│ GAUCHE — Score Consolidé:                                   │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ SCORE CONSOLIDÉ                                          │ │
│ │ ┌────────────────────┐                                   │ │
│ │ │ Score: 3.2/5.0     │ ← finaces-score-gauge 150px      │ │
│ │ │ Jauges par pilier  │   (weighted average)              │ │
│ │ │ Liquidité:    3.0  │                                   │ │
│ │ │ Solvabilité:  3.5  │                                   │ │
│ │ │ Rentabilité:  3.0  │                                   │ │
│ │ │ Capacité:     3.2  │                                   │ │
│ │ │ Qualité:      3.4  │                                   │ │
│ │ └────────────────────┘                                   │ │
│ │                                                          │ │
│ │ Classe Risque:    MODÉRÉ [badge]                         │ │
│ │ État Consolidation: VALIDÉ ✅                             │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ DROITE — Consortium Metrics:                                │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ MÉTRIQUES GROUPEMENT                                     │ │
│ │ Nombre de membres: 3                                     │ │
│ │ Synergy Index: 0.78 (GOOD) [progress bar 60%]            │ │
│ │ Synergy Bonus: +0.25 pts [badge green]                   │ │
│ │ Weak Link Triggered: NON ✅                               │ │
│ │ Leader Blocking: NON ✅                                   │ │
│ │ Aggregation Method: CONJOINTE (weighted average)          │ │
│ │                                                          │ │
│ │ Alert Summary:                                            │ │
│ │ 🟢 Tous les critères validés                              │ │
│ │ • Mandataire viable                                       │ │
│ │ • Aucun maillon faible critique                           │ │
│ │ • Synergie détectée                                       │ │
│ └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘

┌─ SECTION 2: TABLEAU MEMBRES ───────────────────────────────┐
│                                                              │
│ [+ Ajouter un membre]                                       │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ mat-table (editable rows):                               │ │
│ │ Colonne 1: Membre (lien vers dossier individuel)         │ │
│ │ Colonne 2: Rôle (MANDATAIRE 👑 | COTRAITANT)             │ │
│ │ Colonne 3: Part % (éditable, total must = 100%)          │ │
│ │ Colonne 4: Dossier lié (case_id, readonly)               │ │
│ │ Colonne 5: Score MCC (readonly)                          │ │
│ │ Colonne 6: Statut (ACTIF 🟢 | RETRAIT 🔴)                │ │
│ │ Colonne 7: Actions ([Modifier] [Supprimer])              │ │
│ │                                                          │ │
│ │ Row 1: Acme Corp (MANDATAIRE 👑)    40%   ACTIF 🟢       │ │
│ │        Score: 3.5 [← lien clickable]  [Modifier] [Supp] │ │
│ │                                                          │ │
│ │ Row 2: BigTech Inc (COTRAITANT)     35%   ACTIF 🟢       │ │
│ │        Score: 3.1 [← lien clickable]  [Modifier] [Supp] │ │
│ │                                                          │ │
│ │ Row 3: SmallCo Ltd (COTRAITANT)     25%   ACTIF 🟢       │ │
│ │        Score: 2.9 [← lien clickable]  [Modifier] [Supp] │ │
│ │                                                          │ │
│ │ TOTAL:                              100%                  │ │
│ └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘

┌─ SECTION 3: SCORES DÉTAILLÉS PAR MEMBRE ──────────────────┐
│ Accordion (chaque membre):                                  │
│                                                              │
│ ▼ Acme Corp (MANDATAIRE) — Score: 3.5/5.0                  │
│   ┌──────────────────────────────────────────────────────┐  │
│   │ 5 × finaces-pillar-row (readonly)                    │  │
│   │ Liquidité:     3.2 [gauge] [détails]                 │  │
│   │ Solvabilité:   3.6 [gauge] [détails]                 │  │
│   │ Rentabilité:   3.4 [gauge] [détails]                 │  │
│   │ Capacité:      3.7 [gauge] [détails]                 │  │
│   │ Qualité:       3.3 [gauge] [détails]                 │  │
│   │                                                      │  │
│   │ Contribution pondérée:                                │  │
│   │  Score × Part% = 3.5 × 40% = 1.40 pts (sur 5.0)     │  │
│   │  [progress bar visualization]                        │  │
│   │                                                      │  │
│   │ [Voir dossier complet →]                              │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
│ ▼ BigTech Inc (COTRAITANT) — Score: 3.1/5.0                │
│   ┌──────────────────────────────────────────────────────┐  │
│   │ [idem structure]                                     │  │
│   │ Contribution pondérée: 3.1 × 35% = 1.09 pts          │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
│ ▼ SmallCo Ltd (COTRAITANT) — Score: 2.9/5.0                │
│   ┌──────────────────────────────────────────────────────┐  │
│   │ [idem structure]                                     │  │
│   │ Contribution pondérée: 2.9 × 25% = 0.73 pts          │  │
│   │                                                      │  │
│   │ ⚠️ Note: Score légèrement inférieur à la moyenne      │  │
│   │          mais pas de déclenchement weak link          │  │
│   └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘

┌─ SECTION 4: ALERTES & MITIGATIONS ────────────────────────┐
│                                                              │
│ Weak Link Analysis (si triggered):                           │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 🔴 MAILLON FAIBLE DÉTECTÉ                                │ │
│ │ Membre:    SmallCo Ltd                                   │ │
│ │ Score:     2.3/5.0 (vs moyenne: 3.1)                     │ │
│ │ Écart:     -0.8 pts (dépassant seuil -1.5)               │ │
│ │                                                          │ │
│ │ Impact:                                                  │ │
│ │ • Classe risque: MODÉRÉ → ÉLEVÉ (dégradation +1)         │ │
│ │ • Fiabilité consortium: compromise (weakest link)        │ │
│ │                                                          │ │
│ │ Mitigations Recommandées:                                │ │
│ │ □ Réduction part SmallCo (ex: 25% → 10%)                 │ │
│ │ □ Augmentation rôle leader + cotraitant fort             │ │
│ │ □ Caution bancaire spécifique SmallCo                    │ │
│ │ □ Exclusion SmallCo (reformatter JV)                     │ │
│ │                                                          │ │
│ │ [Réduire part] [Exclure membre] [Documenter décision]   │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ Leader Viability (si triggered):                             │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 🔴 LEADER NON VIABLE                                     │ │
│ │ Mandataire: Corp XYZ                                     │ │
│ │ Score:      1.2/5.0 (CRITIQUE)                           │ │
│ │                                                          │ │
│ │ ⚠️ Un leader en CRITIQUE compromet l'ensemble du         │ │
│ │ consortium, même si cotraitants forts.                   │ │
│ │                                                          │ │
│ │ [Changer mandataire] [Demander redressement] [Rejeter]  │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ Synergy Analysis:                                            │ │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ ✅ SYNERGIE DÉTECTÉE                                     │ │
│ │ Index: 0.78/1.0 (GOOD)                                   │ │
│ │                                                          │ │
│ │ Facteurs positifs:                                       │ │
│ │ • Complémentarité sectorielles (Tech + Finance + Ops)    │ │
│ │ • Diversification géographique (US + EU + APAC)          │ │
│ │ • Historique collaboration (3 anciens projets communs)    │ │
│ │ • Couverture produit complète                            │ │
│ │                                                          │ │
│ │ Bonus Accordé: +0.25 pts au score final                  │ │
│ │ Score avant: 3.13 → Score après: 3.38                    │ │
│ └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘

┌─ SECTION 5: RÉSULTAT CONSOLIDATION ────────────────────────┐
│                                                              │
│ Calcul Détaillé:                                             │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ Weighted Average (avant synergy):                         │ │
│ │  (3.5 × 40%) + (3.1 × 35%) + (2.9 × 25%) = 3.13          │ │
│ │                                                          │ │
│ │ Weak Link Penalty:                                        │ │
│ │  SmallCo score 2.9 vs avg 3.13: -0.23 < threshold       │ │
│ │  Penalty: None (no weak link triggered)                   │ │
│ │                                                          │ │
│ │ Synergy Bonus:                                            │ │
│ │  Index 0.78 → Bonus +0.25 pts (formula: min(0.3, ...))   │ │
│ │                                                          │ │
│ │ FINAL SCORE:                                              │ │
│ │  3.13 + 0.25 = 3.38/5.0 (capped at 5.0)                  │ │
│ │                                                          │ │
│ │ Risk Class (sans weak link): MODÉRÉ ✅                    │ │
│ │                                                          │ │
│ │ This score becomes case.mcc_score_final for consortium.   │ │
│ │ Follows to next bloc (Stress Test) as SINGLE case.        │ │
│ └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘

┌─ SECTION 6: ACTIONS & WORKFLOW ────────────────────────────┐
│                                                              │
│ [Recalculer scores] ← reload all member scores from API     │
│ [Documenter decision] → save consortium configuration       │
│ [Continuer vers Stress Test] → move to next bloc            │
│                                                              │
│ Note: Tout changement (remove/add/modify member, part %)    │
│       trigger recalculation automatique.                     │
└────────────────────────────────────────────────────────────┘
```

### ConsortiumScorecardOutput Schema (Backend)

```typescript
{
  id: UUID,
  case_id: UUID,
  jv_type: "SOLIDAIRE" | "CONJOINTE" | "SEPARATE",
  jv_member_count: number,

  // Aggregation results
  weighted_score: number (0-5),
  weak_link_triggered: boolean,
  weak_link_member?: {
    member_id: UUID,
    member_name: string,
    score: number,
    score_gap: number (score - average)
  },
  leader_blocking: boolean,
  leader_blocking_reason?: string,

  // Synergy
  synergy_index: number (0-1.0),
  synergy_bonus: number,
  synergy_factors: [
    {factor: string, weight: number, detected: boolean}
  ],

  // Final aggregated scores
  liquidite_score: number (weighted pillar score),
  solvabilite_score: number,
  rentabilite_score: number,
  capacite_score: number,
  qualite_score: number,

  // Final decision
  final_score: number (weighted_score + synergy_bonus),
  final_risk_class: string (FAIBLE|MODÉRÉ|ÉLEVÉ|CRITIQUE, possibly degraded),
  final_class_reason: string,

  // Aggregated stress test
  aggregated_stress_60d: {status, min_cash},
  aggregated_stress_90d: {status, min_cash},

  // Member details
  members: [
    {
      member_id: UUID,
      case_id: UUID,
      member_name: string,
      role: "MANDATAIRE" | "COTRAITANT",
      participation_pct: number,
      score_mcc: number,
      status: "ACTIF" | "RETRAIT",
      contribution_weighted: number (score × pct),
      pillar_scores: {...}
    }
  ],

  // Mitigations
  suggested_mitigations: [
    {type: string, description: string, impact: string}
  ],

  // Audit
  created_at: ISO timestamp,
  calculated_by: UUID (analyst_id),
  validation_status: "PENDING" | "VALIDATED"
}
```

### Member Management API

**GET Consortium Data:**
```
GET /api/v1/cases/{caseId}/consortium
→ ConsortiumScorecardOutput (+ members list)
```

**POST Add Member:**
```
POST /api/v1/cases/{caseId}/consortium/members
Request: {
  bidder_id: UUID,
  role: "MANDATAIRE" | "COTRAITANT",
  participation_pct: number
}
Response: {id, members: [...], recalculated_score}
```

**PATCH Update Member:**
```
PATCH /api/v1/cases/{caseId}/consortium/members/{memberId}
Request: {
  role?: string,
  participation_pct?: number
}
Response: {id, members: [...], recalculated_score}
```

**DELETE Remove Member:**
```
DELETE /api/v1/cases/{caseId}/consortium/members/{memberId}
Response: {id, members: [...], recalculated_score}
```

**POST Calculate Consortium Score:**
```
POST /api/v1/cases/{caseId}/consortium/calculate
Request: {} (or {force_recalc: true})
Response: ConsortiumScorecardOutput (fully calculated)
```

## CONTRAINTES ANGULAR

**Formulaires:**
- Réactive Forms pour table d'édition (FormArray pour membres)
- Validateurs: participation_pct must sum to 100%
- Real-time recalculation on member change (debounce 500ms)

**State Management:**
- ConsortiumService.getConsortium(caseId) → load consortium data
- ConsortiumService.addMember(caseId, member) → POST
- ConsortiumService.updateMember(caseId, memberId, updates) → PATCH
- ConsortiumService.removeMember(caseId, memberId) → DELETE
- ConsortiumService.calculateScore(caseId) → POST calculate

**Navigation & Guards:**
- CaseStatusGuard: case.status in (SCORING_DONE, STRESS_DONE, ...)
- AuthGuard: ANALYST or ADMIN
- Only visible/accessible if case.case_type = 'GROUPEMENT'

**Change Detection:**
- ChangeDetectionStrategy.OnPush
- Async pipes for observables
- Material table with dynamic datasource

**Accessibility:**
- mat-table with proper headers
- ARIA labels on score gauges
- Keyboard navigation on edit row

## BINDING API

API calls comme spécifié dans "Member Management API" section ci-dessus.

Flux typique:
1. GET /api/v1/cases/{caseId} → detect case_type = GROUPEMENT
2. GET /api/v1/cases/{caseId}/consortium → load current members + scores
3. User modifies members (add/remove/change %) → auto POST/PATCH/DELETE
4. POST /api/v1/cases/{caseId}/consortium/calculate → recalc final score
5. Score returned, displayed, stored in case.mcc_score_final
6. User clicks [Continue to Stress Test] → navigate to P15

## CRITÈRES DE VALIDATION

### Validation Métier
1. ✅ case.case_type = 'GROUPEMENT' (no consortium for SINGLE)
2. ✅ Members sum participation_pct = 100.0 (tolerance ±0.1%)
3. ✅ Exactly 1 MANDATAIRE, 1+ COTRAITANTS
4. ✅ All members have valid case_id (link checks)
5. ✅ Weak link detection correct (score gap calculation)
6. ✅ Synergy index in [0.0, 1.0]
7. ✅ Final score = weighted_score + synergy_bonus (capped 5.0)
8. ✅ Risk class degradation if weak link (max -1 class)
9. ✅ Leader blocking if mandataire score < 1.5

### Validation UI
1. ✅ Member table shows all members, correctly weighted
2. ✅ Scores match backend calculations (re-display after calc)
3. ✅ Alerts (weak link, leader blocking) prominently displayed
4. ✅ Suggested mitigations clickable (e.g., "Exclude member" → dialog)
5. ✅ Form disabled during API calls (spinner shown)
6. ✅ Toast success after member add/remove
7. ✅ Toast error on validation failures (e.g., 100% participation not met)

### Validation API Error Handling
1. ✅ 400 Bad Request (invalid member data) → show error + highlight field
2. ✅ 404 Not Found (member case doesn't exist) → finaces-alert-box error
3. ✅ 409 Conflict (participation sum != 100%) → inline validation error + tooltip
4. ✅ 500 Server Error (calc fails) → alert + retry button

## FICHIERS LIVRÉS À LA FIN DE CE PROMPT

1. **src/app/features/cases/blocs/bloc-12-consortium/bloc-12-consortium.component.ts**
   - Component: load consortium, manage members (add/remove/edit)
   - FormArray for member table
   - Real-time recalculation on changes
   - Error handling

2. **src/app/features/cases/blocs/bloc-12-consortium/bloc-12-consortium.component.html**
   - Full template with 6 sections as specified
   - Member table with edit rows (participation_pct editable)
   - Accordion for detailed scores per member
   - Alerts (weak link, leader blocking, synergy)
   - Dialog trigger buttons ([+ Add Member], [Exclude], etc.)

3. **src/app/features/cases/blocs/bloc-12-consortium/bloc-12-consortium.component.scss**
   - Responsive layout (2 col → 1 col mobile)
   - Alerts styling (warn/error color bands)
   - Table zebra striping, hover effects
   - Score visualization (progress bars, gauges)

4. **src/app/features/cases/blocs/bloc-12-consortium/consortium.service.ts**
   - HttpClient wrappers (GET, POST, PATCH, DELETE)
   - getConsortium(caseId), addMember(), updateMember(), removeMember()
   - calculateScore(caseId)
   - Error handling + interceptors

5. **src/app/features/cases/blocs/bloc-12-consortium/consortium-member-dialog.component.ts|html|scss**
   - Dialog for adding/editing members
   - Form: bidder_id (select from available bidders), role (radio), participation_pct
   - Validation: pct in [1, 100], unique bidder_id per consortium
   - Submit → POST/PATCH API call

6. **app.routes.ts update**
   - Route: `/cases/:caseId/consortium`
   - Component: Bloc12ConsortiumComponent
   - Guards: [CaseStatusGuard, AuthGuard]
   - Data: {caseTypeRequired: 'GROUPEMENT'}

