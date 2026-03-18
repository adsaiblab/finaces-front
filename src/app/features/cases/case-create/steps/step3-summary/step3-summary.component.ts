import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-step3-summary',
    standalone: true,
    imports: [CommonModule, MatIconModule, DecimalPipe],
    templateUrl: './step3-summary.component.html',
    styleUrls: ['./step3-summary.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Step3SummaryComponent {
    readonly parentForm = input.required<FormGroup>();
    get marketData() { return this.parentForm().get('marketInfo')?.value || {}; }
    get bidderData() { return this.parentForm().get('bidder')?.value || {}; }
    get members() { return this.parentForm().get('groupement.members')?.value || []; }
}