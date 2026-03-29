import {
  BalanceSheetAssets,
  BalanceSheetLiabilities,
  IncomeStatement,
  CashFlowStatement,
  FinancialStatementCreate,
  FinancialStatementOut,
} from '../models/financial.model';

/**
 * Backend sends/receives flat financial data (50+ fields at root).
 * Frontend uses nested sub-objects (balance_sheet_assets, income_statement, etc.).
 * This mapper converts between the two representations.
 */

/** Flat shape returned/expected by the backend */
interface BackendFinancialFlat {
  id?: string;
  case_id?: string;
  fiscal_year: number;
  currency_original: string;
  exchange_rate_to_usd: number;
  referentiel: string;
  is_consolidated: boolean;
  created_at?: string;
  // Balance sheet assets
  total_assets: number;
  current_assets: number;
  liquid_assets: number;
  inventory: number;
  other_noncurrent_assets?: number;
  // Balance sheet liabilities
  total_liabilities: number;
  current_liabilities: number;
  long_term_debt: number;
  equity: number;
  // Income statement
  revenue: number;
  gross_profit: number;
  operating_income: number;
  ebitda: number;
  net_income: number;
  extraordinary_expenses?: number;
  dividends?: number;
  // Cash flow
  operating_cash_flow: number;
  investing_cash_flow: number;
  financing_cash_flow: number;
  free_cash_flow: number;
  [key: string]: unknown;
}

export class FinancialMapper {
  /** Backend flat → Frontend nested (for reading) */
  static fromBackend(raw: BackendFinancialFlat): FinancialStatementOut {
    return {
      id: raw.id ?? '',
      case_id: raw.case_id ?? '',
      fiscal_year: raw.fiscal_year,
      currency_original: raw.currency_original,
      exchange_rate_to_usd: raw.exchange_rate_to_usd,
      referentiel: raw.referentiel,
      is_consolidated: raw.is_consolidated,
      created_at: raw.created_at ?? '',
      balance_sheet_assets: {
        total_assets: raw.total_assets,
        current_assets: raw.current_assets,
        liquid_assets: raw.liquid_assets,
        inventory: raw.inventory,
        other_noncurrent_assets: raw.other_noncurrent_assets ?? 0,
      },
      balance_sheet_liabilities: {
        total_liabilities: raw.total_liabilities,
        current_liabilities: raw.current_liabilities,
        long_term_debt: raw.long_term_debt,
        equity: raw.equity,
      },
      income_statement: {
        revenue: raw.revenue,
        gross_profit: raw.gross_profit,
        operating_income: raw.operating_income,
        ebitda: raw.ebitda,
        net_income: raw.net_income,
        extraordinary_expenses: raw.extraordinary_expenses ?? 0,
        dividends: raw.dividends ?? 0,
      },
      cash_flow: {
        operating_cash_flow: raw.operating_cash_flow,
        investing_cash_flow: raw.investing_cash_flow,
        financing_cash_flow: raw.financing_cash_flow,
        free_cash_flow: raw.free_cash_flow,
      },
    };
  }

  /** Frontend nested → Backend flat (for writing) */
  static toBackend(nested: FinancialStatementCreate): BackendFinancialFlat {
    return {
      fiscal_year: nested.fiscal_year,
      currency_original: nested.currency_original,
      exchange_rate_to_usd: nested.exchange_rate_to_usd,
      referentiel: nested.referentiel,
      is_consolidated: nested.is_consolidated,
      ...nested.balance_sheet_assets,
      ...nested.balance_sheet_liabilities,
      ...nested.income_statement,
      ...nested.cash_flow,
    };
  }
}
