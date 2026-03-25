import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FinancialStatementNormalizedSchema } from '../../../../core/models';

@Component({
    selector: 'app-accounting-standard-section',
    standalone: true,
    imports: [CommonModule, MatIconModule, DatePipe],
    templateUrl: './accounting-standard-section.component.html',
    styleUrls: ['./accounting-standard-section.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountingStandardSectionComponent {
    public data = input<FinancialStatementNormalizedSchema>(null as unknown as FinancialStatementNormalizedSchema);
}