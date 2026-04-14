import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  inject,
  DestroyRef,
  effect,
} from '@angular/core';
import { OthersFormValue } from '../../../../core/mappers/financial.mapper';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-tab-others',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './tab-others.component.html',
  styleUrls: ['./tab-others.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabOthersComponent {
  private fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  public year = input<number>(0);
  public initialData = input<OthersFormValue | null>(null);
  public othersDataChange = output<{ data: any }>();
  private isInitializing = false;

  constructor() {
    effect(() => {
      const data = this.initialData();
      this.isInitializing = true;
      if (data) {
        this.othersForm.patchValue(data, { emitEvent: true });
      } else {
        this.othersForm.reset({}, { emitEvent: true });
      }
      this.isInitializing = false;
    });

    this.othersForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((val) => {
        if (this.isInitializing) return;
        this.othersDataChange.emit({ data: val });
      });
  }

  public othersForm: FormGroup = this.fb.group({
    currency: ['MAD', Validators.required],
    exchangeRateToUsd: [1.0, [Validators.required, Validators.min(0)]],
    accountingStandard: ['PCM', Validators.required],
    isConsolidated: [false, Validators.required],
    headcount: [null, [Validators.min(0)]],
    backlogValue: [null, [Validators.min(0)]],
    distributedDividends: [null, [Validators.min(0)]],
    consolidatedAccounts: [false], // UI-only: no backend column, kept for future use
    notes: [''],
  });
}
