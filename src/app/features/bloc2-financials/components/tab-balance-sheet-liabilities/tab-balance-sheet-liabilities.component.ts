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
import { LiabilitiesFormValue } from '../../../../core/mappers/financial.mapper';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-tab-balance-sheet-liabilities',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './tab-balance-sheet-liabilities.component.html',
  styleUrls: ['./tab-balance-sheet-liabilities.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabBalanceSheetLiabilitiesComponent {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  public year = input<number>(0);
  public initialData = input<LiabilitiesFormValue | null>(null);
  public liabilitiesDataChange = output<{ total: number; data: any }>();

  // 1. Initialisation du formulaire avant le constructeur
  public liabilitiesForm: FormGroup = this.fb.group({
    shareCapital: [0, [Validators.required]],
    reserves: [0, [Validators.required]],
    retainedEarningsPrior: [0, [Validators.required]],
    currentYearEarnings: [0, [Validators.required]],
    shortTermDebt: [0, [Validators.required]],
    accountsPayable: [0, [Validators.required]],
    taxAndSocialLiabilities: [0, [Validators.required]],
    otherCurrentLiabilities: [0, [Validators.required]],
    longTermDebt: [0, [Validators.required]],
    longTermProvisions: [0, [Validators.required]],
  });

  // 2. Signaux réactifs dépendant du formulaire
  private formValues = toSignal(this.liabilitiesForm.valueChanges, {
    initialValue: this.liabilitiesForm.value,
  });

  public equityTotal = computed(() => {
    const v = this.formValues();
    return (
      (v.shareCapital || 0) +
      (v.reserves || 0) +
      (v.retainedEarningsPrior || 0) +
      (v.currentYearEarnings || 0)
    );
  });

  public currentLiabilitiesTotal = computed(() => {
    const v = this.formValues();
    return (
      (v.shortTermDebt || 0) +
      (v.accountsPayable || 0) +
      (v.taxAndSocialLiabilities || 0) +
      (v.otherCurrentLiabilities || 0)
    );
  });

  public nonCurrentLiabilitiesTotal = computed(() => {
    const v = this.formValues();
    return (v.longTermDebt || 0) + (v.longTermProvisions || 0);
  });

  public totalLiabilities = computed(() => {
    return (
      this.equityTotal() +
      this.currentLiabilitiesTotal() +
      this.nonCurrentLiabilitiesTotal()
    );
  });

  constructor() {
    // 3. Effect pour le patchValue/reset
    effect(() => {
      const data = this.initialData();
      if (data) {
        this.liabilitiesForm.patchValue(data, { emitEvent: false });
      } else {
        this.liabilitiesForm.reset({}, { emitEvent: false });
      }
    });

    // 4. Émission des changements vers le parent
    this.liabilitiesForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        this.liabilitiesDataChange.emit({
          total: this.totalLiabilities(),
          data: val,
        });
      });
  }
}
