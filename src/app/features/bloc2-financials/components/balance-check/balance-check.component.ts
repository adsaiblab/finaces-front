import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-balance-check',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    templateUrl: './balance-check.component.html',
    styleUrls: ['./balance-check.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BalanceCheckComponent {
    public totalAssets = input.required<number>();
    public totalLiabilities = input.required<number>();

    // Computed signals : recalcul automatique et ultra-performant (sans polluer le template)
    public difference = computed(() => Math.abs(this.totalAssets() - this.totalLiabilities()));
    public isBalanced = computed(() => this.difference() === 0);
}