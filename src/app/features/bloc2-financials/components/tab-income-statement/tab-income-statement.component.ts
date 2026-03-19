import { Component, ChangeDetectionStrategy, input, output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
    selector: 'app-tab-income-statement',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
    templateUrl: './tab-income-statement.component.html',
    styleUrls: ['./tab-income-statement.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabIncomeStatementComponent implements OnInit {
    private fb = inject(FormBuilder);

    public year = input.required<number>();
    public pnlDataChange = output<{ netIncome: number, ebitda: number, data: any }>();

    public pnlForm: FormGroup = this.fb.group({
        revenue: [0, [Validators.required, Validators.min(0)]],
        cogs: [0, [Validators.required, Validators.min(0)]], // Cost of Goods Sold
        operatingExpenses: [0, [Validators.required, Validators.min(0)]],
        depreciationAmortization: [0, [Validators.required, Validators.min(0)]],
        interestExpense: [0, [Validators.required, Validators.min(0)]],
        taxes: [0, [Validators.required, Validators.min(0)]]
    });

    // KPI calculés dynamiquement
    public ebitda = toSignal(
        this.pnlForm.valueChanges.pipe(
            map(v => (v.revenue || 0) - (v.cogs || 0) - (v.operatingExpenses || 0))
        ), { initialValue: 0 }
    );

    public netIncome = toSignal(
        this.pnlForm.valueChanges.pipe(
            map(v => this.ebitda() - (v.depreciationAmortization || 0) - (v.interestExpense || 0) - (v.taxes || 0))
        ), { initialValue: 0 }
    );

    ngOnInit(): void {
        this.pnlForm.valueChanges.subscribe(val => {
            if (this.pnlForm.valid) {
                this.pnlDataChange.emit({
                    netIncome: this.netIncome(),
                    ebitda: this.ebitda(),
                    data: val
                });
            }
        });
    }
}