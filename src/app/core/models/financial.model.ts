import { CaseStatus } from './enums';

export enum AccountingStandard { IFRS = 'IFRS', LOCAL = 'LOCAL', USGAAP = 'USGAAP' }
export enum CurrencyCode { USD = 'USD', EUR = 'EUR', GBP = 'GBP', XOF = 'XOF', XAF = 'XAF', ZAR = 'ZAR', MAD = 'MAD', TND = 'TND', EGP = 'EGP', DZD = 'DZD' }

export interface BalanceSheetAssets {
  total_assets: number;
  current_assets: number;
  liquid_assets: number;
  inventory: number;
  other_noncurrent_assets: number;
}

export interface BalanceSheetLiabilities {
  total_liabilities: number;
  current_liabilities: number;
  long_term_debt: number;
  equity: number;
}

export interface IncomeStatement {
  revenue: number;
  gross_profit: number;
  operating_income: number;
  ebitda: number;
  net_income: number;
  extraordinary_expenses: number;
  dividends: number;
}

export interface CashFlowStatement {
  operating_cash_flow: number;
  investing_cash_flow: number;
  financing_cash_flow: number;
  free_cash_flow: number;
}

export interface FinancialStatementCreate {
  fiscal_year: number;
  currency_original: string;
  exchange_rate_to_usd: number;
  referentiel: string;
  is_consolidated: boolean;
  balance_sheet_assets: BalanceSheetAssets;
  balance_sheet_liabilities: BalanceSheetLiabilities;
  income_statement: IncomeStatement;
  cash_flow: CashFlowStatement;
}

export interface FinancialStatementOut extends FinancialStatementCreate {
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
  statement_id: string;
  fiscal_year: number;
  normalized_revenue: number;
  normalized_ebitda: number;
  normalized_net_income: number;
  normalized_working_capital: number;
  normalized_cash_flow: number;
  adjustments: NormalizationAdjustment[];
  confidence_score: number;
  normalization_date: string;
  normalized_bilan_actif?: BalanceSheetAssets;
  normalized_bilan_passif?: BalanceSheetLiabilities;
  normalized_income_statement?: IncomeStatement;
  normalized_cash_flow_statement?: CashFlowStatement;
  source_standard?: string;
  applied_standard?: string;
  exchange_rate_used?: number;
  exchange_rate_date?: string;
}

export interface NormalizationAdjustment {
  line_item: string;
  original_value: number;
  adjusted_value: number;
  reason: string;
  confidence: number;
}
