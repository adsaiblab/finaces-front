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
    const d = this.data();
    if (!d) return [];

    const h = (id: string, label: string): ComparativeRow =>
      ({ id, label, rawValue: 0, normalizedValue: 0, deltaAmount: 0, deltaPct: 0, note: '', isHeader: true, indentLevel: 0 });
    const r = (label: string, raw: number, norm: number, indent = 1) =>
      this.buildRow(label, raw ?? 0, norm ?? 0, indent);

    return [
      // ── Section 1 : Bilan — Actif ───────────────────────────────────
      h('h-assets', 'BILAN — ACTIF'),
      r('Total Actif', d.total_assets_original, d.total_assets, 1),
      r('Actif Circulant', d.current_assets_original, d.current_assets, 1),
      r('Trésorerie & Équivalents', d.liquid_assets_original, d.liquid_assets, 2),
      r('Stocks', d.inventory_original, d.inventory, 2),
      r('Créances Clients', d.accounts_receivable_original, d.accounts_receivable, 2),
      r('Autres Actifs Courants', d.other_current_assets_original, d.other_current_assets, 2),
      r('Actif Immobilisé', d.non_current_assets_original, d.non_current_assets, 1),
      r('Immobilisations Incorporelles', d.intangible_assets_original, d.intangible_assets, 2),
      r('Immobilisations Corporelles', d.tangible_assets_original, d.tangible_assets, 2),
      r('Actifs Financiers', d.financial_assets_original, d.financial_assets, 2),
      r('Autres Actifs Non Courants', d.other_noncurrent_assets_original, d.other_noncurrent_assets, 2),

      // ── Section 2 : Bilan — Passif & Capitaux Propres ──────────────
      h('h-liabilities', 'BILAN — PASSIF & CAPITAUX PROPRES'),
      r('Total Passif & CP', d.total_liabilities_and_equity_original, d.total_liabilities_and_equity, 1),
      r('Capitaux Propres', d.equity_original, d.equity, 1),
      r('Capital Social', d.share_capital_original, d.share_capital, 2),
      r('Réserves', d.reserves_original, d.reserves, 2),
      r('Report à Nouveau', d.retained_earnings_prior_original, d.retained_earnings_prior, 2),
      r('Résultat de l\'exercice', d.current_year_earnings_original, d.current_year_earnings, 2),
      r('Dettes Long Terme', d.non_current_liabilities_original, d.non_current_liabilities, 1),
      r('Emprunts LT', d.long_term_debt_original, d.long_term_debt, 2),
      r('Provisions LT', d.long_term_provisions_original, d.long_term_provisions, 2),
      r('Dettes Court Terme', d.current_liabilities_original, d.current_liabilities, 1),
      r('Dettes Fournisseurs', d.accounts_payable_original, d.accounts_payable, 2),
      r('Dettes Fiscales & Sociales', d.tax_and_social_liabilities_original, d.tax_and_social_liabilities, 2),
      r('Emprunts CT', d.short_term_debt_original, d.short_term_debt, 2),
      r('Autres Dettes CT', d.other_current_liabilities_original, d.other_current_liabilities, 2),

      // ── Section 3 : Compte de Résultat (complet) ───────────────────
      h('h-income', 'COMPTE DE RÉSULTAT'),
      r('Chiffre d\'Affaires', d.revenue_original, d.revenue, 1),
      r('Production Vendue', d.sold_production_original, d.sold_production, 2),
      r('Autres Produits d\'Exploitation', d.other_operating_revenue_original, d.other_operating_revenue, 2),
      r('Coût des Marchandises Vendues', d.cost_of_goods_sold_original, d.cost_of_goods_sold, 2),
      r('Charges de Personnel', d.personnel_expenses_original, d.personnel_expenses, 2),
      r('Dotations Amortissements (D&A)', d.depreciation_and_amortization_original, d.depreciation_and_amortization, 2),
      r('Résultat Financier (net)', (d.financial_revenue_original ?? 0) - (d.financial_expenses_original ?? 0), (d.financial_revenue ?? 0) - (d.financial_expenses ?? 0), 2),
      r('Produits Financiers', d.financial_revenue_original, d.financial_revenue, 3),
      r('Charges Financières', d.financial_expenses_original, d.financial_expenses, 3),
      r('Résultat Avant Impôt', d.income_before_tax_original, d.income_before_tax, 1),
      r('EBITDA', d.ebitda_original, d.ebitda, 1),
      r('Résultat d\'Exploitation', d.operating_income_original, d.operating_income, 1),
      r('Résultat Net', d.net_income_original, d.net_income, 1),

      // ── Section 4 : Flux de Trésorerie (Cash Flow) — NOUVEAU ───────
      h('h-cashflow', 'FLUX DE TRÉSORERIE'),
      r('FCF d\'Exploitation', d.operating_cash_flow_original, d.operating_cash_flow, 1),
      r('FCF d\'Investissement', d.investing_cash_flow_original, d.investing_cash_flow, 1),
      r('FCF de Financement', d.financing_cash_flow_original, d.financing_cash_flow, 1),
      r('Variation Nette de Trésorerie', d.change_in_cash_original, d.change_in_cash, 1),
      r('Trésorerie Début Période', d.beginning_cash_original, d.beginning_cash, 2),
      r('Trésorerie Fin Période', d.ending_cash_original, d.ending_cash, 2),
      ...(d.capex ? [r('Capex', d.capex_original ?? 0, d.capex, 1)] : []),

      // ── Section 5 : Autres Indicateurs — NOUVEAU ───────────────────
      ...(d.backlog_value || d.headcount ? [
        h('h-others', 'AUTRES INDICATEURS'),
        ...(d.backlog_value ? [r('Carnet de Commandes', d.backlog_value_original ?? 0, d.backlog_value, 1)] : []),
        ...(d.headcount ? [{ id: 'headcount', label: 'Effectifs', rawValue: d.headcount, normalizedValue: d.headcount, deltaAmount: 0, deltaPct: 0, note: 'n/a', indentLevel: 1 } as ComparativeRow] : []),
      ] : []),
    ];
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
