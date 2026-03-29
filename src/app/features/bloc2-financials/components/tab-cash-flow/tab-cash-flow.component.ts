import { DecimalPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, input, output, inject, computed, DestroyRef } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-tab-cash-flow',
    standalone: true,
    imports: [ReactiveFormsModule, DecimalPipe],
    templateUrl: './tab-cash-flow.component.html',
    styleUrls: ['./tab-cash-flow.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabCashFlowComponent {
    private fb = inject(FormBuilder);
    private readonly destroyRef = inject(DestroyRef);

    public year = input<number>(0);
    public cashFlowDataChange = output<{ netCashFlow: number, data: any }>();

    public cashFlowForm: FormGroup = this.fb.group({
        operatingActivities: [0, [Validators.required]],
        investingActivities: [0, [Validators.required]],
        financingActivities: [0, [Validators.required]],
        capex: [0, [Validators.required]],
        beginningCashBalance: [0, [Validators.required]]
    });

    private formValues = toSignal(this.cashFlowForm.valueChanges, { initialValue: this.cashFlowForm.value });

    public changeInCash = computed(() => {
        const v = this.formValues();
        return (v.operatingActivities || 0) + (v.investingActivities || 0) + (v.financingActivities || 0);
    });

    public endingCashBalance = computed(() => {
        const v = this.formValues();
        return (v.beginningCashBalance || 0) + this.changeInCash();
    });

    ngOnInit(): void {
        this.cashFlowForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(val => {
            if (this.cashFlowForm.valid) {
                this.cashFlowDataChange.emit({
                    netCashFlow: this.changeInCash(),
                    data: val
                });
            }
        });
    }
}