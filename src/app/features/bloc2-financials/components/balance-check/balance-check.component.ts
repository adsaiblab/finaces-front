import { NgClass, DecimalPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-balance-check',
    standalone: true,
    imports: [MatIconModule, NgClass, DecimalPipe],
    templateUrl: './balance-check.component.html',
    styleUrls: ['./balance-check.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BalanceCheckComponent {
    public totalAssets = input<number>(0);
    public totalLiabilities = input<number>(0);

    // Computed signals : recalcul automatique et ultra-performant (sans polluer le template)
    public difference = computed(() => Math.abs(this.totalAssets() - this.totalLiabilities()));
    public isBalanced = computed(() => this.difference() === 0);
}