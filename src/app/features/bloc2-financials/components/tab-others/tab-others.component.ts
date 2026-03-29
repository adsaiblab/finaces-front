import { Component, ChangeDetectionStrategy, input, output, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-tab-others',
  standalone: true,
  imports: [ReactiveFormsModule, MatSlideToggleModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './tab-others.component.html',
  styleUrls: ['./tab-others.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabOthersComponent {
  private fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  public year = input<number>(0);
  public othersDataChange = output<{ data: any }>();

  public othersForm: FormGroup = this.fb.group({
    // T08: Metadata fields exposed in the form
    currency_original: ['MAD', Validators.required],
    exchange_rate_to_usd: [1.0, [Validators.required, Validators.min(0)]],
    referentiel: ['PCM', Validators.required],
    is_consolidated: [false, Validators.required],
    // Existing fields
    headcount: [0, [Validators.required, Validators.min(0)]],
    backlogValue: [0, [Validators.required, Validators.min(0)]],
    distributedDividends: [0, [Validators.required, Validators.min(0)]],
    consolidatedAccounts: [false],
    notes: [''],
  });

  ngOnInit(): void {
    this.othersForm.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((val) => {
      if (this.othersForm.valid) {
        this.othersDataChange.emit({
          data: val,
        });
      }
    });
  }
}
