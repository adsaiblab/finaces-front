import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'finaces-ia-unavailable',
    standalone: true,
    imports: [CommonModule, MatButtonModule],
    templateUrl: './finaces-ia-unavailable.component.html',
    styleUrls: ['./finaces-ia-unavailable.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinacesIaUnavailableComponent {
    errorMessage = input<string>('Connection to the AI Scoring Engine failed or timed out.');
    isRetrying = input<boolean>(false);

    retryAction = output<void>();

    onRetry(): void {
        this.retryAction.emit();
    }
}