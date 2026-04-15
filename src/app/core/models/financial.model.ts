
export enum AccountingStandard {
  IFRS = 'IFRS',
  LOCAL = 'LOCAL',
  USGAAP = 'USGAAP',
}
export enum CurrencyCode {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  XOF = 'XOF',
  XAF = 'XAF',
  ZAR = 'ZAR',
  MAD = 'MAD',
  TND = 'TND',
  EGP = 'EGP',
  DZD = 'DZD',
}

export interface BalanceSheetAssets {
  total_assets?: number;
  current_assets?: number;
  liquid_assets: number;
  inventory: number;
  other_noncurrent_assets: number;
  // Detailed fields matching ORM
  intangible_assets?: number;
  tangible_assets?: number;
  financial_assets?: number;
  accounts_receivable?: number;
  other_current_assets?: number;
  non_current_assets?: number;
}

export interface BalanceSheetLiabilities {
  total_liabilities?: number;
  current_liabilities?: number;
  long_term_debt: number;
  equity?: number;
  // Detailed fields matching ORM
  share_capital?: number;
  reserves?: number;
  retained_earnings_prior?: number;
  current_year_earnings?: number;
  non_current_liabilities?: number;
  long_term_provisions?: number;
  short_term_debt?: number;
  accounts_payable?: number;
  tax_and_social_liabilities?: number;
  other_current_liabilities?: number;
}

export interface IncomeStatement {
  revenue: number;
  operating_income?: number;
  ebitda?: number;
  net_income?: number;
  // Detailed fields matching ORM
  gross_profit?: number;
  extraordinary_expenses?: number;
  dividends?: number;
  sold_production?: number;
  other_operating_revenue?: number;
  cost_of_goods_sold?: number;
  external_expenses?: number;
  personnel_expenses?: number;
  taxes_and_duties?: number;
  depreciation_and_amortization?: number;
  other_operating_expenses?: number;
  financial_revenue?: number;
  financial_expenses?: number;
  financial_income?: number;
  income_before_tax?: number;
  extraordinary_income?: number;
  income_tax?: number;
}

export interface CashFlowStatement {
  operating_cash_flow: number;
  investing_cash_flow?: number;
  financing_cash_flow?: number;
  free_cash_flow?: number;
  capex?: number;
  beginning_cash?: number;
}

export interface FinancialStatementNestedCreate {
  fiscal_year: number;
  currency_original: string;
  exchange_rate_to_usd?: number;
  referentiel?: string;
  is_consolidated?: boolean;
  balance_sheet_assets: BalanceSheetAssets;
  balance_sheet_liabilities: BalanceSheetLiabilities;
  income_statement: IncomeStatement;
  cash_flow: CashFlowStatement;
  // Metadata fields
  headcount?: number;
  backlog_value?: number;
  source_notes?: string;
}

// Alias for transition
export type FinancialStatementCreate = FinancialStatementNestedCreate;

export interface FinancialStatementOut extends FinancialStatementNestedCreate {
  id: string;
  case_id: string;
  created_at: string;
}

// Legacy aliases for backward compatibility
export type BilanActifSchema = BalanceSheetAssets;
export type BilanPassifSchema = BalanceSheetLiabilities;
export type IncomeStatementSchema = IncomeStatement;
export type CashFlowSchema = CashFlowStatement;
export type FinancialStatementRawOut = FinancialStatementOut;

export interface FinancialStatementNormalizedSchema {
  id: string;
  raw_statement_id: string;
  fiscal_year: number;
  currency_original: string;
  currency_usd: string;
  exchange_rate: number;

  // #region Assets
  total_assets: number;
  total_assets_original: number;
  current_assets: number;
  current_assets_original: number;
  liquid_assets: number;
  liquid_assets_original: number;
  inventory: number;
  inventory_original: number;
  accounts_receivable: number;
  accounts_receivable_original: number;
  other_current_assets: number;
  other_current_assets_original: number;
  non_current_assets: number;
  non_current_assets_original: number;
  intangible_assets: number;
  intangible_assets_original: number;
  tangible_assets: number;
  tangible_assets_original: number;
  financial_assets: number;
  financial_assets_original: number;
  other_noncurrent_assets: number;
  other_noncurrent_assets_original: number;
  // #endregion

  // #region Liabilities & Equity
  total_liabilities_and_equity: number;
  total_liabilities_and_equity_original: number;
  equity: number;
  equity_original: number;
  share_capital: number;
  share_capital_original: number;
  reserves: number;
  reserves_original: number;
  retained_earnings_prior: number;
  retained_earnings_prior_original: number;
  current_year_earnings: number;
  current_year_earnings_original: number;
  non_current_liabilities: number;
  non_current_liabilities_original: number;
  long_term_debt: number;
  long_term_debt_original: number;
  long_term_provisions: number;
  long_term_provisions_original: number;
  current_liabilities: number;
  current_liabilities_original: number;
  short_term_debt: number;
  short_term_debt_original: number;
  accounts_payable: number;
  accounts_payable_original: number;
  tax_and_social_liabilities: number;
  tax_and_social_liabilities_original: number;
  other_current_liabilities: number;
  other_current_liabilities_original: number;
  // #endregion

  // #region Income Statement
  revenue: number;
  revenue_original: number;
  ebitda: number;
  ebitda_original: number;
  net_income: number;
  net_income_original: number;
  operating_income: number;
  operating_income_original: number;
  // #endregion

  // #region Income Statement (detail)
  sold_production: number;
  sold_production_original: number;
  other_operating_revenue: number;
  other_operating_revenue_original: number;
  cost_of_goods_sold: number;
  cost_of_goods_sold_original: number;
  personnel_expenses: number;
  personnel_expenses_original: number;
  depreciation_and_amortization: number;
  depreciation_and_amortization_original: number;
  financial_revenue: number;
  financial_revenue_original: number;
  financial_expenses: number;
  financial_expenses_original: number;
  income_before_tax: number;
  income_before_tax_original: number;
  // #endregion

  // #region Cash Flow
  operating_cash_flow: number;
  operating_cash_flow_original: number;
  investing_cash_flow: number;
  investing_cash_flow_original: number;
  financing_cash_flow: number;
  financing_cash_flow_original: number;
  change_in_cash: number;
  change_in_cash_original: number;
  beginning_cash: number;
  beginning_cash_original: number;
  ending_cash: number;
  ending_cash_original: number;
  // #endregion

  // #region Metadata
  is_consolidated: boolean;
  adjustments_count: number;
  adjustments: NormalizationAdjustment[];
  headcount?: number;
  backlog_value?: number;
  backlog_value_original?: number;
  capex?: number;
  capex_original?: number;
  // #endregion

  // #region Missions 5 & 6
  coherence: BalanceSheetCoherence | null;
  ratio_readiness: RatioReadiness | null;
  // #endregion
}

export interface NormalizationAdjustment {
  line_item: string;
  original_value: number;
  adjusted_value: number;
  delta: number;
  reason: string;
  standard: string;
}

export interface BalanceSheetCoherence {
  assets_liabilities_balanced: boolean;
  ebitda_coherent: boolean;
  cash_flow_coherent: boolean;
  coherence_score: number;
}

export interface RatioReadiness {
  basic_ratios_ready: boolean;
  advanced_ratios_ready: boolean;
  missing_fields: string[];
}
