import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'finaces-empty-state',
    standalone: true,
    imports: [CommonModule, MatButtonModule],
    templateUrl: './finaces-empty-state.component.html',
    styleUrls: ['./finaces-empty-state.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinacesEmptyStateComponent {
    icon = input<string>('inbox');
    title = input<string>('No Data Found');
    description = input<string>('There is currently no data to display in this section.');
    ctaText = input<string>('');
    ctaColor = input<'primary' | 'accent' | 'warn'>('primary');

    ctaClick = output<void>();

    onAction(): void {
        this.ctaClick.emit();
    }
}