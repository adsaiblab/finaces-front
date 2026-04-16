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

  /** Exchange rate injected from parent so delta can compare raw_usd vs normalized_usd */
  public exchangeRate = input<number>(1);

  /** Event emitted when clicking on an adjusted row */
  public rowClick = output<string>();

  public readonly displayedColumns: string[] = ['item', 'original', 'normalized', 'delta', 'note'];

  // Signal calculé pour transformer le schéma JSON en lignes de tableau aplaties
  public dataSource = computed<ComparativeRow[]>(() => {
    const d = this.data();
    if (!d) return [];

    const h = (id: string, label: string): ComparativeRow =>
      ({ id, label, rawValue: 0, normalizedValue: 0, deltaAmount: 0, deltaPct: 0, note: '', isHeader: true, indentLevel: 0 });
    const r = (label: string, raw: number, norm: number, indent = 1) =>
      this.buildRow(label, raw ?? 0, norm ?? 0, indent);

    return [
      // ── Section 1 : Assets ──────────────────────────────────────────
      h('h-assets', 'ASSETS'),
      r('Total Assets', d.total_assets_original, d.total_assets, 1),
      r('Current Assets', d.current_assets_original, d.current_assets, 1),
      r('Cash & Equivalents', d.liquid_assets_original, d.liquid_assets, 2),
      r('Inventory', d.inventory_original, d.inventory, 2),
      r('Accounts Receivable', d.accounts_receivable_original, d.accounts_receivable, 2),
      r('Other Current Assets', d.other_current_assets_original, d.other_current_assets, 2),
      r('Non-Current Assets', d.non_current_assets_original, d.non_current_assets, 1),
      r('Intangible Assets', d.intangible_assets_original, d.intangible_assets, 2),
      r('Property, Plant & Equipment', d.tangible_assets_original, d.tangible_assets, 2),
      r('Financial Assets', d.financial_assets_original, d.financial_assets, 2),
      r('Other Non-Current Assets', d.other_noncurrent_assets_original, d.other_noncurrent_assets, 2),

      // ── Section 2 : Liabilities & Equity ────────────────────────────
      h('h-liabilities', 'LIABILITIES & EQUITY'),
      r('Total Liabilities & Equity', d.total_liabilities_and_equity_original, d.total_liabilities_and_equity, 1),
      r('Equity', d.equity_original, d.equity, 1),
      r('Share Capital', d.share_capital_original, d.share_capital, 2),
      r('Reserves', d.reserves_original, d.reserves, 2),
      r('Retained Earnings (Prior)', d.retained_earnings_prior_original, d.retained_earnings_prior, 2),
      r('Current Year Earnings', d.current_year_earnings_original, d.current_year_earnings, 2),
      r('Non-Current Liabilities', d.non_current_liabilities_original, d.non_current_liabilities, 1),
      r('Long-Term Financial Debt', d.long_term_debt_original, d.long_term_debt, 2),
      r('Long-Term Provisions', d.long_term_provisions_original, d.long_term_provisions, 2),
      r('Current Liabilities', d.current_liabilities_original, d.current_liabilities, 1),
      r('Accounts Payable', d.accounts_payable_original, d.accounts_payable, 2),
      r('Tax & Social Liabilities', d.tax_and_social_liabilities_original, d.tax_and_social_liabilities, 2),
      r('Short-Term Financial Debt', d.short_term_debt_original, d.short_term_debt, 2),
      r('Other Current Liabilities', d.other_current_liabilities_original, d.other_current_liabilities, 2),

      // ── Section 3 : Income Statement ────────────────────────────────
      h('h-income', 'INCOME STATEMENT'),
      r('Revenue (Sales)', d.revenue_original, d.revenue, 1),
      r('Sold Production', d.sold_production_original, d.sold_production, 2),
      r('Other Operating Income', d.other_operating_revenue_original, d.other_operating_revenue, 2),
      r('Cost of Goods Sold (COGS)', d.cost_of_goods_sold_original, d.cost_of_goods_sold, 2),
      r('Personnel Expenses', d.personnel_expenses_original, d.personnel_expenses, 2),
      r('Depreciation & Amortization', d.depreciation_and_amortization_original, d.depreciation_and_amortization, 2),
      r('Net Financial Result', (d.financial_revenue_original ?? 0) - (d.financial_expenses_original ?? 0), (d.financial_revenue ?? 0) - (d.financial_expenses ?? 0), 2),
      r('Financial Income', d.financial_revenue_original, d.financial_revenue, 3),
      r('Financial Expenses', d.financial_expenses_original, d.financial_expenses, 3),
      r('Ordinary Income', d.income_before_tax_original, d.income_before_tax, 1),
      r('Exceptional Income (Expense)', d.extraordinary_income_original, d.extraordinary_income, 1),
      r('Income Tax', d.income_tax_original, d.income_tax, 1),
      r('EBITDA', d.ebitda_original, d.ebitda, 1),
      r('Operating Income', d.operating_income_original, d.operating_income, 1),
      r('Net Income', d.net_income_original, d.net_income, 1),

      // ── Section 4 : Cash Flow ────────────────────────────────────────
      h('h-cashflow', 'CASH FLOW'),
      r('Operating Cash Flow (CFO)', d.operating_cash_flow_original, d.operating_cash_flow, 1),
      r('Investing Cash Flow (CFI)', d.investing_cash_flow_original, d.investing_cash_flow, 1),
      r('Financing Cash Flow (CFF)', d.financing_cash_flow_original, d.financing_cash_flow, 1),
      r('Change in Cash', d.change_in_cash_original, d.change_in_cash, 1),
      r('Beginning Cash Balance', d.beginning_cash_original, d.beginning_cash, 2),
      r('Ending Cash Balance', d.ending_cash_original, d.ending_cash, 2),
      ...(d.capex ? [r('CAPEX', d.capex_original ?? 0, d.capex, 1)] : []),
    ];
  });

  private buildRow(
    label: string,
    raw: number,
    norm: number,
    indent: number,
    manualNote?: string,
  ): ComparativeRow {
    /**
     * Δ represents the IFRS restatement adjustment BEYOND currency conversion.
     * raw_usd = raw_MAD / exchange_rate  → what the original value would be in USD
     * Δ = (normalized_usd - raw_usd) / raw_usd
     * This is ~0% when only currency conversion was applied (no actual IFRS adjustment).
     * Only true restatements (e.g. IFRS 16 lease capitalization) produce a non-zero Δ.
     */
    const rate = this.exchangeRate() || 1;
    const rawUsd = rate !== 0 ? raw / rate : raw;  // convert MAD→USD for apples-to-apples
    const deltaAmount = norm - rawUsd;
    const deltaPct = rawUsd !== 0 ? (deltaAmount / rawUsd) * 100 : 0;

    let note = 'OK';
    if (manualNote) {
      note = manualNote;
    } else if (Math.abs(deltaPct) > 1) {
      // Only flag as adjusted if restatement is > 1% (pure conversion noise is < 0.01%)
      note = 'Δ';
    }

    return {
      id: label.toLowerCase().replace(/\s+/g, '-'),
      label,
      rawValue: raw,       // displayed in MAD (source currency)
      normalizedValue: norm, // displayed in USD (after conversion + restatements)
      deltaAmount,
      deltaPct,
      note,
      indentLevel: indent,
    };
  }

  public getDeltaColorClass(deltaPct: number): string {
    const absDelta = Math.abs(deltaPct);
    if (absDelta <= 1) return 'text-success';   // pure conversion or negligible
    if (absDelta <= 10) return 'text-warning';   // minor restatement
    return 'text-error';                          // significant IFRS adjustment
  }

  public onRowClick(row: ComparativeRow): void {
    if (row.note === 'Δ') {
      this.rowClick.emit(row.id);
    }
  }
}
