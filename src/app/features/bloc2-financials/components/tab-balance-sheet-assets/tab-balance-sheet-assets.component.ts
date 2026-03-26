import { Component, ChangeDetectionStrategy, input, output, OnInit, inject, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-tab-balance-sheet-assets',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './tab-balance-sheet-assets.component.html',
    styleUrls: ['./tab-balance-sheet-assets.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabBalanceSheetAssetsComponent implements OnInit {
    private fb = inject(FormBuilder);
    private destroyRef = inject(DestroyRef);

    public year = input<number>(0);
    public assetsDataChange = output<{ total: number, data: any }>();

    public assetsForm: FormGroup = this.fb.group({
        intangibleAssets: [0, [Validators.required]],
        tangibleAssets: [0, [Validators.required]],
        financialAssets: [0, [Validators.required]],
        otherNonCurrentAssets: [0, [Validators.required]],
        inventory: [0, [Validators.required]],
        accountsReceivable: [0, [Validators.required]],
        otherCurrentAssets: [0, [Validators.required]],
        liquidAssets: [0, [Validators.required]]
    });

    private formValues = toSignal(this.assetsForm.valueChanges, { initialValue: this.assetsForm.value });

    public nonCurrentAssetsTotal = computed(() => {
        const v = this.formValues();
        return (v.intangibleAssets || 0) + (v.tangibleAssets || 0) + (v.financialAssets || 0) + (v.otherNonCurrentAssets || 0);
    });

    public currentAssetsTotal = computed(() => {
        const v = this.formValues();
        return (v.inventory || 0) + (v.accountsReceivable || 0) + (v.otherCurrentAssets || 0) + (v.liquidAssets || 0);
    });

    public totalAssets = computed(() => {
        return this.nonCurrentAssetsTotal() + this.currentAssetsTotal();
    });

    ngOnInit(): void {
        this.assetsForm.valueChanges.pipe(
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(val => {
            if (this.assetsForm.valid) {
                this.assetsDataChange.emit({
                    total: this.totalAssets(),
                    data: val
                });
            }
        });
    }
}