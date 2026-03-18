import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
    selector: 'app-step1-market-info',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCheckboxModule],
    templateUrl: './step1-market-info.component.html',
    styleUrls: ['./step1-market-info.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Step1MarketInfoComponent {
    readonly formGroup = input.required<FormGroup>();
}