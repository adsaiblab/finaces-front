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

  constructor() {
    effect(() => {
      const data = this.initialData();
      if (data) {
        this.pnlForm.patchValue(data, { emitEvent: false });
      }
    });
  }

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

  // Capture the entire form value reactively
  private formValues = toSignal(this.pnlForm.valueChanges, { initialValue: this.pnlForm.value });

  // KPI calculés dynamiquement via computed()
  public operatingIncome = computed(() => {
    const v = this.formValues();
    return (
      (v.revenue || 0) +
      (v.soldProduction || 0) +
      (v.otherOperatingIncome || 0) -
      (v.consumedPurchases || 0) -
      (v.externalExpenses || 0) -
      (v.personnelExpenses || 0) -
      (v.taxesAndDuties || 0) -
      (v.depreciationAmortization || 0)
    );
  });

  public ebitda = computed(() => {
    const v = this.formValues();
    return this.operatingIncome() + (v.depreciationAmortization || 0);
  });

  public netFinancialResult = computed(() => {
    const v = this.formValues();
    return (v.financialIncome || 0) - (v.financialExpenses || 0);
  });

  public ordinaryIncome = computed(() => {
    return this.operatingIncome() + this.netFinancialResult();
  });

  public netIncome = computed(() => {
    const v = this.formValues();
    return this.ordinaryIncome() + (v.exceptionalIncome || 0) - (v.incomeTax || 0);
  });

  ngOnInit(): void {
    this.pnlForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((val) => {
      if (this.pnlForm.valid) {
        this.pnlDataChange.emit({
          netIncome: this.netIncome(),
          ebitda: this.ebitda(),
          data: val,
        });
      }
    });
  }
}
