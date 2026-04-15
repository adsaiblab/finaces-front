import { NgClass } from '@angular/common';
import { Component, ChangeDetectionStrategy, input, computed, output } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FinancialStatementNormalizedSchema } from '../../../../core/models';

export interface ComparativeRow {
  id: string;
  label: string;
  rawValue: number;
  normalizedValue: number;
  deltaAmount: number;
  deltaPct: number;
  note: string;
  isHeader?: boolean;
  isTotal?: boolean;
  indentLevel?: number;
}

@Component({
  selector: 'app-comparative-table',
  standalone: true,
  imports: [MatTableModule, MatIconModule, MatTooltipModule, CurrencyPipe, DecimalPipe, NgClass],
  templateUrl: './comparative-table.component.html',
  styleUrls: ['./comparative-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComparativeTableComponent {
  public data = input<FinancialStatementNormalizedSchema>(
    null as unknown as FinancialStatementNormalizedSchema,
  );

  // Événement émis lors du clic sur une ligne ayant un ajustement, pour scroller vers les détails
  public rowClick = output<string>();

  public readonly displayedColumns: string[] = ['item', 'original', 'normalized', 'delta', 'note'];

  // Signal calculé pour transformer le schéma JSON en lignes de tableau aplaties
  public dataSource = computed<ComparativeRow[]>(() => {
    const rawData = this.data();
    if (!rawData) return [];

    const rows: ComparativeRow[] = [
      // --- ASSETS ---
      { id: 'h1', label: 'ASSETS', rawValue: 0, normalizedValue: 0, deltaAmount: 0, deltaPct: 0, note: '', isHeader: true, indentLevel: 0 },
      this.buildRow('Total Assets', rawData.total_assets_original, rawData.total_assets, 1),
      this.buildRow('Current Assets', rawData.current_assets_original, rawData.current_assets, 1),
      this.buildRow('Cash & Equivalents', rawData.liquid_assets_original, rawData.liquid_assets, 2),
      this.buildRow('Inventory', rawData.inventory_original, rawData.inventory, 2),
      this.buildRow('Accounts Receivable', rawData.accounts_receivable_original, rawData.accounts_receivable, 2),
      this.buildRow('Non-Current Assets', rawData.non_current_assets_original, rawData.non_current_assets, 1),
      this.buildRow('Tangible Assets', rawData.tangible_assets_original, rawData.tangible_assets, 2),

      // --- LIABILITIES & EQUITY ---
      { id: 'h2', label: 'EQUITY & LIABILITIES', rawValue: 0, normalizedValue: 0, deltaAmount: 0, deltaPct: 0, note: '', isHeader: true, indentLevel: 0 },
      this.buildRow('Total Equity', rawData.equity_original, rawData.equity, 1),
      this.buildRow('Share Capital', rawData.share_capital_original, rawData.share_capital, 2),
      this.buildRow('Current Liabilities', rawData.current_liabilities_original, rawData.current_liabilities, 1),
      this.buildRow('Short Term Debt', rawData.short_term_debt_original, rawData.short_term_debt, 2),
      this.buildRow('Non-Current Liabilities', rawData.non_current_liabilities_original, rawData.non_current_liabilities, 1),
      this.buildRow('Long Term Debt', rawData.long_term_debt_original, rawData.long_term_debt, 2),

      // --- INCOME STATEMENT ---
      { id: 'h3', label: 'INCOME STATEMENT', rawValue: 0, normalizedValue: 0, deltaAmount: 0, deltaPct: 0, note: '', isHeader: true, indentLevel: 0 },
      this.buildRow('Revenue', rawData.revenue_original, rawData.revenue, 1),
      this.buildRow('EBITDA', rawData.ebitda_original, rawData.ebitda, 1),
      this.buildRow('Operating Income', rawData.operating_income_original, rawData.operating_income, 1),
      this.buildRow('Net Income', rawData.net_income_original, rawData.net_income, 1),
    ];

    return rows;
  });

  private buildRow(
    label: string,
    raw: number,
    norm: number,
    indent: number,
    manualNote?: string,
  ): ComparativeRow {
    const deltaAmount = norm - raw;
    const deltaPct = raw !== 0 ? (deltaAmount / raw) * 100 : 0;
    let note = 'OK';
    if (manualNote) {
      note = manualNote;
    } else if (Math.abs(deltaPct) > 0) {
      note = 'Δ';
    }

    return {
      id: label.toLowerCase().replace(/\s+/g, '-'),
      label,
      rawValue: raw,
      normalizedValue: norm,
      deltaAmount,
      deltaPct,
      note,
      indentLevel: indent,
    };
  }

  public getDeltaColorClass(deltaPct: number): string {
    const absDelta = Math.abs(deltaPct);
    if (absDelta === 0) return 'text-success';
    if (absDelta > 0 && absDelta <= 10) return 'text-warning';
    return 'text-error';
  }

  public onRowClick(row: ComparativeRow): void {
    if (row.note === 'Δ') {
      this.rowClick.emit(row.id);
    }
  }
}
