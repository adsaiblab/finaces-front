import { NgClass } from '@angular/common';
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RatioValue } from '../../../../core/models/ratio.model';

export interface RatioRow {
  key: string;
  label: string;
  value: RatioValue;
}

@Component({
  selector: 'app-ratio-group-card',
  standalone: true,
  imports: [MatCardModule, MatTableModule, MatIconModule, MatTooltipModule, DecimalPipe, NgClass],
  templateUrl: './ratio-group-card.component.html',
  styleUrls: ['./ratio-group-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatioGroupCardComponent {
  public groupName = input<string>('');
  public groupIcon = input<string>('');
  public ratios = input<any>(null); // Reçoit le groupe spécifique (LiquidityGroup, etc.)

  public displayedColumns = ['indicator', 'value', 'status', 'variation'];

  public ratioRows = computed<RatioRow[]>(() => {
    const data = this.ratios();
    if (!data) return [];

    return Object.entries(data).map(([key, value]) => ({
      key,
      label: this.formatLabel(key),
      value: value as RatioValue,
    }));
  });

  private formatLabel(key: string): string {
    const labels: Record<string, string> = {
      current_ratio: 'Current Ratio',
      quick_ratio: 'Quick Ratio',
      cash_ratio: 'Cash Ratio',
      working_capital: 'Working Capital',
      wcr: 'Working Capital Requirement (WCR)',
      wcr_pct_revenue: 'WCR / Revenue',
      dso_days: 'Days Sales Outstanding (DSO)',
      dpo_days: 'Days Payable Outstanding (DPO)',
      dio_days: 'Days Inventory Outstanding (DIO)',
      cash_conversion_cycle: 'Cash Conversion Cycle',
      debt_to_equity: 'Debt to Equity',
      financial_autonomy: 'Financial Autonomy',
      gearing: 'Gearing',
      interest_coverage: 'Interest Coverage',
      debt_repayment_years: 'Debt Repayment (Years)',
      negative_equity: 'Negative Equity Flag',
      net_margin: 'Net Margin',
      ebitda_margin: 'EBITDA Margin',
      operating_margin: 'Operating Margin',
      roa: 'Return on Assets (ROA)',
      roe: 'Return on Equity (ROE)',
      cash_flow_capacity: 'Cash Flow Capacity',
      cf_capacity_margin: 'CF Capacity Margin',
      operating_cash_flow: 'Operating Cash Flow',
    };
    return labels[key] || key.replace(/_/g, ' ');
  }

  public formatValue(ratioValue: RatioValue): string {
    if (ratioValue.current === null || ratioValue.current === undefined) return '—';
    if (ratioValue.unit === '%') return `${ratioValue.current.toFixed(1)}%`;
    if (ratioValue.unit === 'days') return `${ratioValue.current.toFixed(0)} days`;
    if (ratioValue.unit === 'currency') return `$${(ratioValue.current / 1000000).toFixed(2)}M`;
    if (ratioValue.unit === 'binary') return ratioValue.current === 1 ? 'Yes' : 'No';
    return ratioValue.current.toFixed(2);
  }

  public statusIcon(status: string): string {
    const icons: Record<string, string> = {
      GREEN: 'check_circle',
      YELLOW: 'info',
      ORANGE: 'warning',
      RED: 'error',
    };
    return icons[status] || 'help';
  }

  public statusColorClass(status: string): string {
    const classes: Record<string, string> = {
      GREEN: 'text-[color:var(--color-success)]',
      YELLOW: 'text-[#ffc107]', // Yellow specifically for ratios
      ORANGE: 'text-[color:var(--color-warning)]',
      RED: 'text-[color:var(--color-error)]',
    };
    return classes[status] || 'text-[color:var(--color-content-secondary)]';
  }
}
