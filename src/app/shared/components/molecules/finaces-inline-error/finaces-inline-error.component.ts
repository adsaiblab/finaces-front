import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'finaces-inline-error',
  standalone: true,
  imports: [],
  templateUrl: './finaces-inline-error.component.html',
  styleUrls: ['./finaces-inline-error.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinacesInlineErrorComponent {
  message = input<string>('Unable to load data for this specific section.');
  retryCount = input<number>(0);
  maxRetries = input<number>(3);

  retry = output<void>();
  ignore = output<void>();

  get canRetry(): boolean {
    return this.retryCount() < this.maxRetries();
  }

  onRetry(): void {
    if (this.canRetry) {
      this.retry.emit();
    }
  }

  onIgnore(): void {
    this.ignore.emit();
  }
}
