import { DecimalPipe } from '@angular/common';
import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  computed,
  DestroyRef,
  effect,
} from '@angular/core';
import { AssetsFormValue } from '../../../../core/mappers/financial.mapper';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-tab-balance-sheet-assets',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './tab-balance-sheet-assets.component.html',
  styleUrls: ['./tab-balance-sheet-assets.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabBalanceSheetAssetsComponent {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  public year = input<number>(0);
  public initialData = input<AssetsFormValue | null>(null);
  public assetsDataChange = output<{ total: number; data: any }>();

  // 1. Initialisation du formulaire avant le constructeur
  public assetsForm: FormGroup = this.fb.group({
    intangibleAssets: [0, [Validators.required]],
    tangibleAssets: [0, [Validators.required]],
    financialAssets: [0, [Validators.required]],
    otherNonCurrentAssets: [0, [Validators.required]],
    inventory: [0, [Validators.required]],
    accountsReceivable: [0, [Validators.required]],
    otherCurrentAssets: [0, [Validators.required]],
    liquidAssets: [0, [Validators.required]],
  });

  // 2. Signaux réactifs dépendant du formulaire
  private formValues = toSignal(this.assetsForm.valueChanges, {
    initialValue: this.assetsForm.value,
  });

  public nonCurrentAssetsTotal = computed(() => {
    const v = this.formValues();
    return (
      (Number(v.intangibleAssets) || 0) +
      (Number(v.tangibleAssets) || 0) +
      (Number(v.financialAssets) || 0) +
      (Number(v.otherNonCurrentAssets) || 0)
    );
  });

  public currentAssetsTotal = computed(() => {
    const v = this.formValues();
    return (
      (Number(v.inventory) || 0) +
      (Number(v.accountsReceivable) || 0) +
      (Number(v.otherCurrentAssets) || 0) +
      (Number(v.liquidAssets) || 0)
    );
  });

  public totalAssets = computed(() => {
    return this.nonCurrentAssetsTotal() + this.currentAssetsTotal();
  });

  constructor() {
    // 3. Effect pour le patchValue/reset
    effect(() => {
      const data = this.initialData();
      if (data) {
        this.assetsForm.patchValue(data, { emitEvent: false });
      } else {
        this.assetsForm.reset({}, { emitEvent: false });
      }
    });

    // 4. Émission des changements vers le parent (Placé dans le constructeur)
    this.assetsForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        this.assetsDataChange.emit({
          total: this.totalAssets(),
          data: val,
        });
      });
  }
}
