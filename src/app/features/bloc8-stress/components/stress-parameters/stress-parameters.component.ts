import { Component, ChangeDetectionStrategy, output, inject } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { StressParameters } from '../../../../core/models/stress.model';

@Component({
  selector: 'app-stress-parameters',
  standalone: true,
  imports: [ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './stress-parameters.component.html',
  styleUrls: ['./stress-parameters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StressParametersComponent {
  private fb = inject(FormBuilder);

  public paramsChange = output<Partial<StressParameters>>();

  public paramsForm: FormGroup = this.fb.group({
    contract_value: [0, [Validators.required, Validators.min(0)]],
    initial_cash: [0, [Validators.required]],
    available_credit: [0, [Validators.required, Validators.min(0)]],
    operating_cash_flow: [0, [Validators.required]],
  });

  ngOnInit(): void {
    this.paramsForm.valueChanges.subscribe((value) => {
      if (this.paramsForm.valid) {
        this.paramsChange.emit(value);
      }
    });
  }
}
