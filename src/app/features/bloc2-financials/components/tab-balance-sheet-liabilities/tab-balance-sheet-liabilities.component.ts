import { Component, ChangeDetectionStrategy, input, output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
    selector: 'app-tab-balance-sheet-liabilities',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
    templateUrl: './tab-balance-sheet-liabilities.component.html',
    styleUrls: ['./tab-balance-sheet-liabilities.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabBalanceSheetLiabilitiesComponent implements OnInit {
    private fb = inject(FormBuilder);

    public year = input.required<number>();
    public liabilitiesDataChange = output<{ total: number, data: any }>();

    public liabilitiesForm: FormGroup = this.fb.group({
        equity: this.fb.group({
            shareCapital: [0, [Validators.required, Validators.min(0)]],
            retainedEarnings: [0, Validators.required] // Peut être négatif
        }),
        nonCurrentLiabilities: this.fb.group({
            longTermDebt: [0, [Validators.required, Validators.min(0)]]
        }),
        currentLiabilities: this.fb.group({
            shortTermDebt: [0, [Validators.required, Validators.min(0)]],
            accountsPayable: [0, [Validators.required, Validators.min(0)]]
        })
    });

    public totalLiabilities = toSignal(
        this.liabilitiesForm.valueChanges.pipe(
            map(v => {
                const eq = (v.equity?.shareCapital || 0) + (v.equity?.retainedEarnings || 0);
                const ncl = v.nonCurrentLiabilities?.longTermDebt || 0;
                const cl = (v.currentLiabilities?.shortTermDebt || 0) + (v.currentLiabilities?.accountsPayable || 0);
                return eq + ncl + cl;
            })
        ), { initialValue: 0 }
    );

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