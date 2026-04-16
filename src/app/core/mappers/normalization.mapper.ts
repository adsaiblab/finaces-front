import { FinancialStatementNormalizedSchema, NormalizationAdjustment } from '../models/financial.model';

/**
 * NormalizationMapper — Convertit la réponse brute de l'API (où Pydantic
 * peut sérialiser des Decimal en strings "123456.00") en un objet TypeScript
 * fortement typé avec des `number` natifs.
 *
 * Règle : toujours utiliser ce mapper après un appel au endpoint normalisé.
 */
export class NormalizationMapper {
  static fromBackend(raw: Record<string, unknown>): FinancialStatementNormalizedSchema {
    const n = (key: string): number => Number(raw[key] ?? 0);
    const opt = (key: string): number | undefined => raw[key] != null ? Number(raw[key]) : undefined;

    return {
      // Metadata de base
      id: raw['id'] as string,
      raw_statement_id: raw['raw_statement_id'] as string,
      fiscal_year: Number(raw['fiscal_year']),
      currency_original: (raw['currency_original'] as string) ?? 'MAD',
      currency_usd: (raw['currency_usd'] as string) ?? 'USD',
      exchange_rate: n('exchange_rate'),

      // Assets USD
      total_assets: n('total_assets'),
      total_assets_original: n('total_assets_original'),
      current_assets: n('current_assets'),
      current_assets_original: n('current_assets_original'),
      liquid_assets: n('liquid_assets'),
      liquid_assets_original: n('liquid_assets_original'),
      inventory: n('inventory'),
      inventory_original: n('inventory_original'),
      accounts_receivable: n('accounts_receivable'),
      accounts_receivable_original: n('accounts_receivable_original'),
      other_current_assets: n('other_current_assets'),
      other_current_assets_original: n('other_current_assets_original'),
      non_current_assets: n('non_current_assets'),
      non_current_assets_original: n('non_current_assets_original'),
      intangible_assets: n('intangible_assets'),
      intangible_assets_original: n('intangible_assets_original'),
      tangible_assets: n('tangible_assets'),
      tangible_assets_original: n('tangible_assets_original'),
      financial_assets: n('financial_assets'),
      financial_assets_original: n('financial_assets_original'),
      other_noncurrent_assets: n('other_noncurrent_assets'),
      other_noncurrent_assets_original: n('other_noncurrent_assets_original'),

      // Liabilities & Equity USD
      total_liabilities_and_equity: n('total_liabilities_and_equity'),
      total_liabilities_and_equity_original: n('total_liabilities_and_equity_original'),
      equity: n('equity'),
      equity_original: n('equity_original'),
      share_capital: n('share_capital'),
      share_capital_original: n('share_capital_original'),
      reserves: n('reserves'),
      reserves_original: n('reserves_original'),
      retained_earnings_prior: n('retained_earnings_prior'),
      retained_earnings_prior_original: n('retained_earnings_prior_original'),
      current_year_earnings: n('current_year_earnings'),
      current_year_earnings_original: n('current_year_earnings_original'),
      non_current_liabilities: n('non_current_liabilities'),
      non_current_liabilities_original: n('non_current_liabilities_original'),
      long_term_debt: n('long_term_debt'),
      long_term_debt_original: n('long_term_debt_original'),
      long_term_provisions: n('long_term_provisions'),
      long_term_provisions_original: n('long_term_provisions_original'),
      accounts_payable: n('accounts_payable'),
      accounts_payable_original: n('accounts_payable_original'),
      current_liabilities: n('current_liabilities'),
      current_liabilities_original: n('current_liabilities_original'),
      short_term_debt: n('short_term_debt'),
      short_term_debt_original: n('short_term_debt_original'),
      tax_and_social_liabilities: n('tax_and_social_liabilities'),
      tax_and_social_liabilities_original: n('tax_and_social_liabilities_original'),
      other_current_liabilities: n('other_current_liabilities'),
      other_current_liabilities_original: n('other_current_liabilities_original'),

      // Income Statement
      revenue: n('revenue'),
      revenue_original: n('revenue_original'),
      ebitda: n('ebitda'),
      ebitda_original: n('ebitda_original'),
      net_income: n('net_income'),
      net_income_original: n('net_income_original'),
      operating_income: n('operating_income'),
      operating_income_original: n('operating_income_original'),
      sold_production: n('sold_production'),
      sold_production_original: n('sold_production_original'),
      other_operating_revenue: n('other_operating_revenue'),
      other_operating_revenue_original: n('other_operating_revenue_original'),
      cost_of_goods_sold: n('cost_of_goods_sold'),
      cost_of_goods_sold_original: n('cost_of_goods_sold_original'),
      personnel_expenses: n('personnel_expenses'),
      personnel_expenses_original: n('personnel_expenses_original'),
      depreciation_and_amortization: n('depreciation_and_amortization'),
      depreciation_and_amortization_original: n('depreciation_and_amortization_original'),
      financial_revenue: n('financial_revenue'),
      financial_revenue_original: n('financial_revenue_original'),
      financial_expenses: n('financial_expenses'),
      financial_expenses_original: n('financial_expenses_original'),
      income_before_tax: n('income_before_tax'),
      income_before_tax_original: n('income_before_tax_original'),
      extraordinary_income: n('extraordinary_income'),
      extraordinary_income_original: n('extraordinary_income_original'),
      income_tax: n('income_tax'),
      income_tax_original: n('income_tax_original'),

      // Cash Flow
      operating_cash_flow: n('operating_cash_flow'),
      operating_cash_flow_original: n('operating_cash_flow_original'),
      investing_cash_flow: n('investing_cash_flow'),
      investing_cash_flow_original: n('investing_cash_flow_original'),
      financing_cash_flow: n('financing_cash_flow'),
      financing_cash_flow_original: n('financing_cash_flow_original'),
      change_in_cash: n('change_in_cash'),
      change_in_cash_original: n('change_in_cash_original'),
      beginning_cash: n('beginning_cash'),
      beginning_cash_original: n('beginning_cash_original'),
      ending_cash: n('ending_cash'),
      ending_cash_original: n('ending_cash_original'),

      // Metadata
      is_consolidated: Boolean(raw['is_consolidated']),
      adjustments_count: Number(raw['adjustments_count'] ?? 0),
      adjustments: (raw['adjustments'] as NormalizationAdjustment[]) ?? [],
      headcount: opt('headcount'),
      backlog_value: opt('backlog_value'),
      backlog_value_original: opt('backlog_value_original'),
      capex: opt('capex'),
      capex_original: opt('capex_original'),

      // Missions 5 & 6
      coherence: (raw['coherence'] as FinancialStatementNormalizedSchema['coherence']) ?? null,
      ratio_readiness: (raw['ratio_readiness'] as FinancialStatementNormalizedSchema['ratio_readiness']) ?? null,
    };
  }

  static fromBackendList(raws: Record<string, unknown>[]): FinancialStatementNormalizedSchema[] {
    return raws.map((r) => NormalizationMapper.fromBackend(r));
  }
}
