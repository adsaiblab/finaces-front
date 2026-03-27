import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-tab-others',
  standalone: true,
  imports: [ReactiveFormsModule, MatSlideToggleModule],
  templateUrl: './tab-others.component.html',
  styleUrls: ['./tab-others.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabOthersComponent {
  private fb = inject(FormBuilder);

  public year = input<number>(0);
  public othersDataChange = output<{ data: any }>();

  public othersForm: FormGroup = this.fb.group({
    headcount: [0, [Validators.required, Validators.min(0)]],
    backlogValue: [0, [Validators.required, Validators.min(0)]],
    distributedDividends: [0, [Validators.required, Validators.min(0)]],
    consolidatedAccounts: [false],
    notes: [''],
  });

  ngOnInit(): void {
    this.othersForm.valueChanges.subscribe((val) => {
      if (this.othersForm.valid) {
        this.othersDataChange.emit({
          data: val,
        });
      }
    });
  }
}
