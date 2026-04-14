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
import { CashFlowFormValue } from '../../../../core/mappers/financial.mapper';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-tab-cash-flow',
  standalone: true,
  imports: [ReactiveFormsModule, DecimalPipe],
  templateUrl: './tab-cash-flow.component.html',
  styleUrls: ['./tab-cash-flow.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabCashFlowComponent {
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  public year = input<number>(0);
  public initialData = input<CashFlowFormValue | null>(null);
  public cashFlowDataChange = output<{ netCashFlow: number; data: any }>();

  constructor() {
    effect(() => {
      const data = this.initialData();
      if (data) {
        this.cashflowForm.patchValue(data, { emitEvent: false });
      } else {
        this.cashflowForm.reset({}, { emitEvent: false });
      }
    });
  }

  public cashflowForm: FormGroup = this.fb.group({
    operatingActivities: [0, [Validators.required]],
    investingActivities: [0, [Validators.required]],
    financingActivities: [0, [Validators.required]],
    freeCashFlow: [0],
    beginningCashBalance: [0, [Validators.required]],
    capex: [0, [Validators.required]],
  });

  private formValues = toSignal(this.cashflowForm.valueChanges, { initialValue: this.cashflowForm.value });

  public netCashFlow = computed(() => {
    const v = this.formValues();
    return (
      (v.operatingActivities || 0) +
      (v.investingActivities || 0) +
      (v.financingActivities || 0)
    );
  });

  public endingCashBalance = computed(() => {
    return (this.formValues().beginningCashBalance || 0) + this.netCashFlow();
  });

  ngOnInit(): void {
    this.cashflowForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((val) => {
      if (this.cashflowForm.valid) {
        this.cashFlowDataChange.emit({
          netCashFlow: this.netCashFlow(),
          data: val,
        });
      }
    });
  }
}
