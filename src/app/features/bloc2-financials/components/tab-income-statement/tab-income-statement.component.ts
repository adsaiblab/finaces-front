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
import { PnlFormValue } from '../../../../core/mappers/financial.mapper';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-tab-income-statement',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './tab-income-statement.component.html',
  styleUrls: ['./tab-income-statement.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabIncomeStatementComponent {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  public year = input<number>(0);
  public initialData = input<PnlFormValue | null>(null);
  public pnlDataChange = output<{ netIncome: number; ebitda: number; data: any }>();

  // 1. Initialisation du formulaire avant le constructeur
  public pnlForm: FormGroup = this.fb.group({
    revenue: [0, [Validators.required]],
    soldProduction: [0, [Validators.required]],
    otherOperatingIncome: [0, [Validators.required]],
    consumedPurchases: [0, [Validators.required]],
    externalExpenses: [0, [Validators.required]],
    personnelExpenses: [0, [Validators.required]],
    taxesAndDuties: [0, [Validators.required]],
    depreciationAmortization: [0, [Validators.required]],
    financialIncome: [0, [Validators.required]],
    financialExpenses: [0, [Validators.required]],
    exceptionalIncome: [0, [Validators.required]],
    incomeTax: [0, [Validators.required]],
  });

  // 2. Capture de la valeur du formulaire
  private formValues = toSignal(this.pnlForm.valueChanges, { initialValue: this.pnlForm.value });

  // 3. KPI calculés dynamiquement via computed()
  public operatingIncome = computed(() => {
    const v = this.formValues();
    return (
      (Number(v.revenue) || 0) +
      (Number(v.soldProduction) || 0) +
      (Number(v.otherOperatingIncome) || 0) -
      (Number(v.consumedPurchases) || 0) -
      (Number(v.externalExpenses) || 0) -
      (Number(v.personnelExpenses) || 0) -
      (Number(v.taxes and duties) || 0) -
      (Number(v.depreciationAmortization) || 0)
    );
  });

  public ebitda = computed(() => {
    const v = this.formValues();
    return this.operatingIncome() + (Number(v.depreciationAmortization) || 0);
  });

  public netFinancialResult = computed(() => {
    const v = this.formValues();
    return (Number(v.financialIncome) || 0) - (Number(v.financialExpenses) || 0);
  });

  public ordinaryIncome = computed(() => {
    return this.operatingIncome() + this.netFinancialResult();
  });

  public netIncome = computed(() => {
    const v = this.formValues();
    return this.ordinaryIncome() + (Number(v.exceptionalIncome) || 0) - (Number(v.incomeTax) || 0);
  });

  constructor() {
    // 4. Effect pour le patchValue/reset
    effect(() => {
      const data = this.initialData();
      if (data) {
        this.pnlForm.patchValue(data, { emitEvent: false });
      } else {
        this.pnlForm.reset({}, { emitEvent: false });
      }
    });

    // 5. Émission des changements vers le parent
    this.pnlForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        this.pnlDataChange.emit({
          netIncome: this.netIncome(),
          ebitda: this.ebitda(),
          data: val,
        });
      });
  }
}
