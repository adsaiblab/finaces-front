import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type SkeletonVariant = 'card' | 'table' | 'chart' | 'gauge';

@Component({
    selector: 'finaces-skeleton-loader',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './finaces-skeleton-loader.component.html',
    styleUrls: ['./finaces-skeleton-loader.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinacesSkeletonLoaderComponent {
    variant = input<SkeletonVariant>('card');
    rows = input<number>(3); // For table variant

    get iterableRows(): number[] {
        return Array(this.rows()).fill(0);
    }
}