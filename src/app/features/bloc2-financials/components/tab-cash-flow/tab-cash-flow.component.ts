import { Component, ChangeDetectionStrategy, input, output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
    selector: 'app-tab-cash-flow',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
    templateUrl: './tab-cash-flow.component.html',
    styleUrls: ['./tab-cash-flow.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabCashFlowComponent implements OnInit {
    private fb = inject(FormBuilder);

    public year = input.required<number>();
    public cashFlowDataChange = output<{ netCashFlow: number, data: any }>();

    public cashFlowForm: FormGroup = this.fb.group({
        operatingActivities: [0, Validators.required],
        investingActivities: [0, Validators.required],
        financingActivities: [0, Validators.required]
    });

    public netCashFlow = toSignal(
        this.cashFlowForm.valueChanges.pipe(
            map(v => (v.operatingActivities || 0) + (v.investingActivities || 0) + (v.financingActivities || 0))
        ), { initialValue: 0 }
    );

    ngOnInit(): void {
        this.cashFlowForm.valueChanges.subscribe(val => {
            if (this.cashFlowForm.valid) {
                this.cashFlowDataChange.emit({
                    netCashFlow: this.netCashFlow(),
                    data: val
                });
            }
        });
    }
}