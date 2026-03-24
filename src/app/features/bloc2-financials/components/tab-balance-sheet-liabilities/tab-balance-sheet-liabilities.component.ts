import { Component, ChangeDetectionStrategy, input, output, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-tab-balance-sheet-liabilities',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './tab-balance-sheet-liabilities.component.html',
    styleUrls: ['./tab-balance-sheet-liabilities.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabBalanceSheetLiabilitiesComponent implements OnInit {
    private fb = inject(FormBuilder);

    public year = input.required<number>();
    public liabilitiesDataChange = output<{ total: number, data: any }>();

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
        longTermProvisions: [0, [Validators.required]]
    });

    private formValues = toSignal(this.liabilitiesForm.valueChanges, { initialValue: this.liabilitiesForm.value });

    public equityTotal = computed(() => {
        const v = this.formValues();
        return (v.shareCapital || 0) + (v.reserves || 0) + (v.retainedEarningsPrior || 0) + (v.currentYearEarnings || 0);
    });

    public currentLiabilitiesTotal = computed(() => {
        const v = this.formValues();
        return (v.shortTermDebt || 0) + (v.accountsPayable || 0) + (v.taxAndSocialLiabilities || 0) + (v.otherCurrentLiabilities || 0);
    });

    public nonCurrentLiabilitiesTotal = computed(() => {
        const v = this.formValues();
        return (v.longTermDebt || 0) + (v.longTermProvisions || 0);
    });

    public totalLiabilities = computed(() => {
        return this.equityTotal() + this.currentLiabilitiesTotal() + this.nonCurrentLiabilitiesTotal();
    });

    ngOnInit(): void {
        this.liabilitiesForm.valueChanges.subscribe(val => {
            if (this.liabilitiesForm.valid) {
                this.liabilitiesDataChange.emit({
                    total: this.totalLiabilities(),
                    data: val
                });
            }
        });
    }
}