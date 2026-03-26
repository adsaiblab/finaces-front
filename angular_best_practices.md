# ✅ Checklist — Bonnes Pratiques Angular (FinaCES)

> Basée sur les bugs rencontrés et corrigés en session — mise à jour au 2026-03-26.

---

## 1. 📡 Signals — Utiliser `input()` au lieu de `@Input()`

| ❌ Anti-pattern | ✅ Correct |
|---|---|
| `@Input() size: 'sm' \| 'md' = 'md'` | `readonly size = input<'sm' \| 'md'>('md')` |
| `@Input({ required: true }) foo!: T` | `readonly foo = input<T>(DEFAULT_VALUE)` |
| Getter dynamique `get badgeClasses()` avec OnPush | `readonly badgeClasses = computed(() => ...)` |

**Pourquoi** : `@Input()` + `OnPush` + getter = NG0100 (ExpressionChangedAfterChecked).  
`computed()` est stable entre les cycles CD → zéro NG0100.

---

## 2. 🚫 Jamais `input.required<>()` pour un composant testé en isolation

```typescript
// ❌ Cause NG0950 dans les specs (detectChanges avant setInput)
features = input.required<ShapFeature[]>();

// ✅ Toujours un défaut vide
features = input<ShapFeature[]>([]);
```

**Règle** : `input.required` est interdit sur tout composant **atom/shared** ou testé en isolation.
Même si le spec appelle `setInput('x', val)`, si un test suivant ne le reset pas, le computed qui lit `x()` plante NG0950.

> ⚠️ **Cas réel** : `finaces-risk-badge` — le test `should include badge-sm class` appelait `setInput('size', 'sm')` sans re-setter `riskClass` → NG0950 sur `badgeClasses computed`.

---

## 3. 🔑 Clé `paramMap` — Vérifier le nom exact du segment de route

```typescript
// Route : cases/:id
// ❌
this.route.parent?.snapshot.paramMap.get('caseId') // retourne null → redirect !

// ✅
this.route.parent?.snapshot.paramMap.get('id')     // correct
```

**Règle** : le nom dans `paramMap.get('X')` doit correspondre EXACTEMENT au segment `:X` dans [app.routes.ts](file:///Users/adsa/Documents/aDSa.DEV/FinaCES/finaces-front/src/app/app.routes.ts).

---

## 4. ⚡ `effect()` — Ne jamais l'appeler dans le constructeur si lié au DOM

```typescript
// ❌ "Schedulers cannot synchronously execute watches while scheduling"
constructor() {
    effect(() => { this.renderChart(this.chartData()!, canvas); });
}

// ✅ Déclencher après que le DOM soit stable
constructor() {
    afterNextRender(() => { this.renderChart(...); });
}
```

**Règle** : `effect()` dans le constructeur + lecture du DOM = erreur scheduler en test.

---

## 5. 📋 Specs — FormGroup doit contenir TOUS les formControlName du template

```typescript
// ❌ Ne contient pas tous les contrôles du HTML → "Cannot find control"
formGroup = fb.group({ qualitativeNotes: [''] });

// ✅ Miroir exact des formControlName du template
formGroup = fb.group({
    liquidity_comment: [''],
    solvability_comment: [''],
    profitability_comment: [''],
    // ...tous les autres
});
```

---

## 6. 🛡️ Templates — Toujours garder les inputs nullable avec `@if`

```html
<!-- ❌ Crash si zscore() est null -->
<div [ngClass]="{'distress': zscore().z_score_zone === 'DISTRESS'}">

<!-- ✅ Guard obligatoire -->
@if (zscore()) {
    <div [ngClass]="{'distress': zscore()!.z_score_zone === 'DISTRESS'}">
}
```

**Règle** : tout `input<T | null>(null)` dont les propriétés sont accédées dans le template doit être gardé par `@if`.

---

## 7. 🧪 Specs — Utiliser `async + whenStable()` pour les propriétés mutables

```typescript
// ⚠️ whenStable() ne suffit pas pour les composants @Input + ngOnChanges + OnPush
// setInput() ne déclenche pas ngOnChanges() dans JSDOM
// ❌ Retourne 0 au lieu de 100
fixture.componentRef.setInput('documents', mockDocs);
fixture.detectChanges();
await fixture.whenStable();
expect(component.yearlyProgress[0].progressPercent).toBe(100); // FAIL

// ✅ Assigner directement + appeler ngOnChanges() manuellement
component.documents = mockDocs;
component.ngOnChanges({ documents: { currentValue: mockDocs, previousValue: [], firstChange: false, isFirstChange: () => false } });
fixture.detectChanges();
expect(component.yearlyProgress[0].progressPercent).toBe(100); // PASS
```

---

## 8. 🔗 Vérifier les URLs de navigation dans TOUS les composants

```typescript
// ❌ Mauvaise route (n'existe pas dans app.routes.ts)
this.router.navigate(['/cases', id, 'expert-review']);

// ✅ Correspond à la route déclarée
this.router.navigate(['/cases', id, 'expert']);
```

**Règle** : après avoir déclaré une route, grep tous les `router.navigate` du projet pour vérifier la cohérence.

---

## 9. 📤 `@Output()` → `output()` lors de la migration vers signals

```typescript
// Si tu migres @Input → input(), migre aussi @Output → output()
@Output() sealGate = new EventEmitter<void>(); // ❌ mixte
readonly sealGate = output<void>();            // ✅ homogène
```

---

## 10. 🔄 Fallback mock pour le développement sans backend

```typescript
// Pattern recommandé en phase de développement/test frontend
this.service.callApi(id).pipe(
    catchError(() => of(MOCK_DATA))  // ← fallback si backend KO
).subscribe(data => this.data.set(data));
```

---

## 11. 🏷️ Sélecteurs partagés — Pas de préfixe `app-`

```html
<!-- ❌ atoms/shared n'utilisent PAS le préfixe app- -->
<app-finaces-risk-badge [riskClass]="..."></app-finaces-risk-badge>
<app-finaces-tension-badge [tension]="..."></app-finaces-tension-badge>

<!-- ✅ Sélecteurs réels (lire le @Component.selector du .ts) -->
<finaces-risk-badge [riskClass]="..."></finaces-risk-badge>
<finaces-tension-badge [level]="..."></finaces-tension-badge>
```

**Règle** : toujours vérifier `selector:` dans le `.ts` du composant avant de l'utiliser dans un template.

---

## 12. 🗂️ Noms de champs — snake_case backend ≠ camelCase imaginé

```html
<!-- ❌ Le modèle EvaluationCaseDetailOut vient du backend Python (snake_case) -->
{{ currentCase()?.bidderName }}     <!-- undefined -->
{{ currentCase()?.contractValue }}  <!-- undefined -->

<!-- ✅ Copier le nom exact depuis core/models/ -->
{{ currentCase()?.bidder_name }}
{{ currentCase()?.contract_value }}
```

**Règle** : avant d'écrire un binding template, ouvrir l'interface TypeScript dans `core/models/` et copier le champ exactement.

---

## 13. 🔎 Inputs d'un composant partagé — Toujours auditer le .ts avant usage

```html
<!-- ❌ Supposer le nom de l'input sans vérifier -->
<finaces-tension-badge [tension]="level">   <!-- 'tension' n'existe pas -->

<!-- ✅ Après avoir lu finaces-tension-badge.component.ts -->
<finaces-tension-badge [level]="tensionLevel">  <!-- input correct -->
```

**Règle** : avant d'utiliser un composant partagé, ouvrir son `.ts` et lire tous ses `input()` / `@Input()`.
