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

  // 1. Initialisation du formulaire avant le constructeur
  public cashFlowForm: FormGroup = this.fb.group({
    operatingActivities: [0, [Validators.required]],
    investingActivities: [0, [Validators.required]],
    financingActivities: [0, [Validators.required]],
    freeCashFlow: [0],
    beginningCashBalance: [0, [Validators.required]],
    capex: [0, [Validators.required]],
  });

  // 2. Signaux réactifs basés sur le formulaire
  private formValues = toSignal(this.cashFlowForm.valueChanges, { 
    initialValue: this.cashFlowForm.value 
  });

  public changeInCash = computed(() => {
    const v = this.formValues();
    return (
      (Number(v.operatingActivities) || 0) +
      (Number(v.investingActivities) || 0) +
      (Number(v.financingActivities) || 0)
    );
  });

  public endingCashBalance = computed(() => {
    return (Number(this.formValues().beginningCashBalance) || 0) + this.changeInCash();
  });

  constructor() {
    // 3. Effect pour le patchValue/reset
    effect(() => {
      const data = this.initialData();
      if (data) {
        this.cashFlowForm.patchValue(data, { emitEvent: true });
      } else {
        this.cashFlowForm.reset({}, { emitEvent: true });
      }
    });

    // 4. Émission des changements vers le parent (Placé dans le constructeur pour takeUntilDestroyed)
    this.cashFlowForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        const currentNetFlow = (val.operatingActivities || 0) + (val.investingActivities || 0) + (val.financingActivities || 0);
        this.cashFlowDataChange.emit({
          netCashFlow: currentNetFlow,
          data: val,
        });
      });
  }
}
