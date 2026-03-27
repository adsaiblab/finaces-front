# COMPTE-RENDU — SESSION S5 : Core Services & Models

**Auditeur** : Claude Opus 4.6
**Date** : 2026-03-27
**Périmètre** : 19 findings (F-S5-01 → F-S5-19) — Modèles (`case`, `scoring`, `expert`, `gate`, `ia`, `financial`, barrel) + Services (`case`, `ia`, `stress`, `document`)

---

## Bilan synthétique

| Métrique | Valeur |
|:--|:--|
| Findings vérifiés | 19 / 19 |
| ✅ Confirmés | 17 |
| ⚠️ Confirmés avec nuances | 2 |
| ❌ Faux positifs | 0 |

---

## MODÈLES (F-S5-01 → F-S5-07)

---

### F-S5-01 — `case.model.ts` : 4 champs `any` dans `EvaluationCaseDetailOut`

**Verdict : ✅ CONFIRMÉ**

Lignes 98-102 :
```typescript
documents?: any[];
financial_statements?: any[];
scorecard?: any;
expert_review?: any;
```

---

### F-S5-02 — `scoring.model.ts` / `ratio.model.ts` : Collision `RatioSetSchema`

**Verdict : ✅ CONFIRMÉ**

Deux définitions incompatibles du même nom d'interface :

- **`scoring.model.ts`** (lignes 39-68) : structure plate avec 28 propriétés scalaires (`current_ratio`, `quick_ratio`, `altman_zscore_zone`, etc.)
- **`ratio.model.ts`** (lignes 70-83) : structure imbriquée avec groupes (`LiquidityGroup`, `SolvencyGroup`, `ProfitabilityGroup`, `CapacityGroup`, `ZScoreGroup`) + `coherence_alerts`

La collision est réelle — l'ordre d'import détermine quelle version est utilisée.

---

### F-S5-03 — `expert.model.ts` : `override_recommendation` string libre

**Verdict : ✅ CONFIRMÉ**

- Ligne 10 (`ExpertReviewInputSchema`) : `override_recommendation?: string;`
- Ligne 27 (`ExpertReviewOutputSchema`) : `override_recommendation?: string;`

Aucune contrainte de valeur.

---

### F-S5-04 — `gate.model.ts` : `verdict` en français avec accents

**Verdict : ✅ CONFIRMÉ**

Ligne 37 : `verdict: 'PASSÉ' | 'BLOQUÉ' | 'EN ATTENTE';`

Valeurs françaises accentuées dans un type discriminant TypeScript.

---

### F-S5-05 — `ia.model.ts` : `WhatIfScenario` input/output mélangés

**Verdict : ✅ CONFIRMÉ**

Lignes 42-47 :
```typescript
export interface WhatIfScenario {
    scenario_name: string;                    // INPUT
    feature_modifications: Record<string, number>;  // INPUT
    predicted_score_if?: number;              // OUTPUT
    predicted_class_if?: string;              // OUTPUT
}
```

---

### F-S5-06 — `core/models/index.ts` : `ratio.model.ts` absent du barrel

**Verdict : ✅ CONFIRMÉ**

Le barrel (lignes 1-11) exporte 11 modèles : `dashboard`, `case`, `financial`, `scoring`, `ia`, `stress`, `expert`, `document`, `consortium`, `gate`, `tension`. **`ratio.model` est absent**.

---

### F-S5-07 — `financial.model.ts` : `CurrencyCode` enum incomplet

**Verdict : ✅ CONFIRMÉ**

Lignes 7-14 : 6 devises uniquement (`USD`, `EUR`, `GBP`, `XOF`, `XAF`, `ZAR`). Les devises MENA/Afrique du Nord absentes : `MAD`, `TND`, `EGP`, `DZD`.

---

## SERVICES (F-S5-08 → F-S5-19)

---

### F-S5-08 — `case.service.ts` : `computeRatios()` retourne `Observable<any>`

**Verdict : ✅ CONFIRMÉ**

Lignes 137-140 :
```typescript
computeRatios(caseId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${caseId}/ratios/compute`, {})
        .pipe(catchError(this.handleError));
}
```

---

### F-S5-09 — `case.service.ts` : `catchError(this.handleError)` perd le `this`

**Verdict : ⚠️ CONFIRMÉ AVEC NUANCE**

Le pattern `.pipe(catchError(this.handleError))` est utilisé sur **toutes les méthodes HTTP** du service. L'audit annonce **14 méthodes**. Le code réel en contient **19** :

`getCases`, `getCaseDetail`, `createCase`, `saveCaseDraft`, `getCaseStatus`, `transitionStatus`, `getBidders`, `getDashboardStats`, `getRecentCases`, `getConvergenceChart`, `getActiveTensionCases`, `evaluateGate`, `patchCaseStatus`, `getFinancials`, `saveFinancials`, `deleteFinancials`, `normalizeFinancials`, `getNormalizedFinancials`, `computeRatios`

L'audit **sous-estime** l'impact : 19 méthodes affectées, pas 14.

---

### F-S5-10 — `case.service.ts` : `console.error()` en production

**Verdict : ✅ CONFIRMÉ**

Ligne 34 :
```typescript
private handleError(error: HttpErrorResponse) {
    console.error('CaseService API Error:', error);
    return throwError(() => new Error(error.message || 'Server Error'));
}
```

Aucun guard `!environment.production`.

---

### F-S5-11 — `case.service.ts` : `getBidders()` endpoint non standard

**Verdict : ✅ CONFIRMÉ**

Lignes 70-73 : `getBidders()` appelle `${this.apiUrl}/bidders` — les bidders sont une sous-ressource `/cases/bidders`.

---

### F-S5-12 — `ia.service.ts` : `tap(console.log)` en production (×2)

**Verdict : ✅ CONFIRMÉ**

- Ligne 17 : `tap(result => console.log('✅ [IA Model] Prediction fetched successfully:', result))`
- Ligne 27 : `tap(result => console.log('✅ [IA Model] What-If Simulation complete:', result))`

---

### F-S5-13 — `ia.service.ts` : `console.error()` en production (×2)

**Verdict : ✅ CONFIRMÉ**

- Ligne 19 : `console.error('❌ [IA Model] Prediction error:', err)`
- Ligne 29 : `console.error('❌ [IA Model] Simulation error:', err)`

Aucun guard `!environment.production`.

---

### F-S5-14 — `ia.service.ts` : Typage retour après F-S5-05

**Verdict : ⚠️ CONFIRMÉ AVEC NUANCE**

Les méthodes sont actuellement typées comme `Observable<IAPredictionResult>` — **pas `any`**. Le finding porte sur la cohérence APRÈS la séparation `WhatIfScenarioInput` / `WhatIfScenarioResult` (F-S5-05). `simulateWhatIf()` retourne actuellement `IAPredictionResult` au lieu d'un type dédié `WhatIfScenarioResult`.

C'est un **finding de cohérence dépendant de F-S5-05**, pas un bug actuel de typage `any`.

---

### F-S5-15 — `stress.service.ts` : `tap(console.log)` en production (×2)

**Verdict : ✅ CONFIRMÉ**

- Ligne 18 : `tap(res => console.log('✅ [Stress Test] Fetched successfully:', res))`
- Ligne 29 : `tap(res => console.log('✅ [Stress Test] Custom simulation complete:', res))`

---

### F-S5-16 — `stress.service.ts` : `console.error()` en production (×2)

**Verdict : ✅ CONFIRMÉ**

- Ligne 20 : `console.error('❌ [Stress Test] Fetch error:', err)`
- Ligne 31 : `console.error('❌ [Stress Test] Simulation error:', err)`

Aucun guard `!environment.production`.

---

### F-S5-17 — `document.service.ts` : `constructor(private http)` legacy

**Verdict : ✅ CONFIRMÉ**

Ligne 13 : `constructor(private http: HttpClient) { }` — pattern legacy au lieu de `inject(HttpClient)`.

---

### F-S5-18 — `document.service.ts` : Aucun `catchError` sur les 4 méthodes

**Verdict : ✅ CONFIRMÉ**

4 méthodes sans aucune gestion d'erreur :
- Ligne 15 : `uploadGateDocument()` — pas de catchError
- Ligne 22 : `getGateDocuments()` — pas de catchError
- Ligne 28 : `getDocumentIntegrity()` — pas de catchError
- Ligne 34 : `deleteDocument()` — pas de catchError

---

### F-S5-19 — `document.service.ts` : `getDocumentIntegrity()` retourne `Observable<any>`

**Verdict : ✅ CONFIRMÉ**

Lignes 28-32 :
```typescript
getDocumentIntegrity(caseId: string, docId: string): Observable<any> {
    return this.http.get<any>(
        `${this.apiUrl}/${caseId}/documents/${docId}/integrity`
    );
}
```

---

## Résumé des actions S5

| Finding | Sévérité | Verdict | Fichier |
|:--|:--|:--|:--|
| F-S5-01 | 🔴 CRITIQUE | ✅ Confirmé | case.model.ts |
| F-S5-02 | 🔴 CRITIQUE | ✅ Confirmé | scoring.model.ts + ratio.model.ts |
| F-S5-03 | 🟠 MAJEUR | ✅ Confirmé | expert.model.ts |
| F-S5-04 | 🟠 MAJEUR | ✅ Confirmé | gate.model.ts |
| F-S5-05 | 🟠 MAJEUR | ✅ Confirmé | ia.model.ts |
| F-S5-06 | 🟠 MAJEUR | ✅ Confirmé | index.ts |
| F-S5-07 | 🟡 MINEUR | ✅ Confirmé | financial.model.ts |
| F-S5-08 | 🔴 CRITIQUE | ✅ Confirmé | case.service.ts |
| F-S5-09 | 🟠 MAJEUR | ⚠️ Confirmé (19 méthodes, pas 14) | case.service.ts |
| F-S5-10 | 🟠 MAJEUR | ✅ Confirmé | case.service.ts |
| F-S5-11 | 🟡 MINEUR | ✅ Confirmé | case.service.ts |
| F-S5-12 | 🔴 CRITIQUE | ✅ Confirmé | ia.service.ts |
| F-S5-13 | 🟠 MAJEUR | ✅ Confirmé | ia.service.ts |
| F-S5-14 | — | ⚠️ Dépendance F-S5-05 (pas de bug `any` actuel) | ia.service.ts |
| F-S5-15 | 🔴 CRITIQUE | ✅ Confirmé | stress.service.ts |
| F-S5-16 | 🟠 MAJEUR | ✅ Confirmé | stress.service.ts |
| F-S5-17 | 🔴 CRITIQUE | ✅ Confirmé | document.service.ts |
| F-S5-18 | 🔴 CRITIQUE | ✅ Confirmé | document.service.ts |
| F-S5-19 | 🔴 CRITIQUE | ✅ Confirmé | document.service.ts |

**Bilan : 17/19 confirmés exactement, 2 avec nuances (F-S5-09 sous-estimé, F-S5-14 dépendant de F-S5-05). 0 faux positif.**
