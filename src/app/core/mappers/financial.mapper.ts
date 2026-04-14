import {
  FinancialStatementNestedCreate,
  FinancialStatementOut,
} from '../models/financial.model';

export interface AssetsFormValue {
  intangibleAssets: number;
  tangibleAssets: number;
  financialAssets: number;
  otherNonCurrentAssets: number;
  inventory: number;
  accountsReceivable: number;
  otherCurrentAssets: number;
  liquidAssets: number;
  totalAssets?: number;
  currentAssetsTotal?: number;
  nonCurrentAssetsTotal?: number;
}

export interface LiabilitiesFormValue {
  shareCapital: number;
  reserves: number;
  retainedEarningsPrior: number;
  currentYearEarnings: number;
  shortTermDebt: number;
  accountsPayable: number;
  taxAndSocialLiabilities: number;
  otherCurrentLiabilities: number;
  longTermDebt: number;
  longTermProvisions: number;
  equityTotal?: number;
  currentLiabilitiesTotal?: number;
  nonCurrentLiabilitiesTotal?: number;
  totalLiabilities?: number;
}

export interface PnlFormValue {
  revenue: number;
  soldProduction: number;
  otherOperatingIncome: number;
  consumedPurchases: number;
  externalExpenses: number;
  personnelExpenses: number;
  taxesAndDuties: number;
  depreciationAmortization: number;
  financialIncome: number;
  financialExpenses: number;
  exceptionalIncome: number;
  incomeTax: number;
  operatingIncome?: number;
  ebitda?: number;
  netIncome?: number;
}

export interface CashFlowFormValue {
  operatingActivities: number;
  investingActivities: number;
  financingActivities: number;
  capex: number;
  beginningCashBalance: number;
  freeCashFlow?: number;
}

export interface OthersFormValue {
  currency: string;
  exchangeRateToUsd?: number;
  referentiel?: string;
  isConsolidated?: boolean;
  fiscalYear?: number;
  headcount?: number;
  backlogValue?: number;
  distributedDividends?: number;
  consolidatedAccounts?: boolean;
  notes?: string;
}

/**
 * Mapper for Financial Statements.
 * Bridges the gap between Frontend (CamelCase UI Forms) 
 * and Backend (SnakeCase Nested API Schemas).
 */
export class FinancialMapper {
  
  /** UI Form -> API Nested (for saving) */
  static toApi(
    fiscalYear: number,
    baseInfo: OthersFormValue,
    forms: { 
      assets: AssetsFormValue; 
      liabilities: LiabilitiesFormValue; 
      pnl: PnlFormValue; 
      cashflow: CashFlowFormValue 
    }
  ): FinancialStatementNestedCreate {
    return {
      fiscal_year: fiscalYear,
      currency_original: baseInfo.currency || 'USD',
      exchange_rate_to_usd: baseInfo.exchangeRateToUsd || 1.0,
      referentiel: baseInfo.referentiel || 'IFRS',
      is_consolidated: baseInfo.isConsolidated || false,
      balance_sheet_assets: {
        total_assets: forms.assets.totalAssets || 0,
        current_assets: forms.assets.currentAssetsTotal || 0,
        liquid_assets: forms.assets.liquidAssets || 0,
        inventory: forms.assets.inventory || 0,
        intangible_assets: forms.assets.intangibleAssets,
        tangible_assets: forms.assets.tangibleAssets,
        financial_assets: forms.assets.financialAssets,
        accounts_receivable: forms.assets.accountsReceivable,
        other_current_assets: forms.assets.otherCurrentAssets,
        other_noncurrent_assets: forms.assets.otherNonCurrentAssets,
      },
      balance_sheet_liabilities: {
        total_liabilities: forms.liabilities.totalLiabilities || 0,
        current_liabilities: forms.liabilities.currentLiabilitiesTotal || 0,
        long_term_debt: forms.liabilities.longTermDebt || 0,
        equity: forms.liabilities.equityTotal || 0,
        share_capital: forms.liabilities.shareCapital,
        reserves: forms.liabilities.reserves,
        retained_earnings_prior: forms.liabilities.retainedEarningsPrior,
        current_year_earnings: forms.liabilities.currentYearEarnings,
        short_term_debt: forms.liabilities.shortTermDebt,
        accounts_payable: forms.liabilities.accountsPayable,
        tax_and_social_liabilities: forms.liabilities.taxAndSocialLiabilities,
        other_current_liabilities: forms.liabilities.otherCurrentLiabilities,
        long_term_provisions: forms.liabilities.longTermProvisions,
      },
      income_statement: {
        revenue: forms.pnl.revenue || 0,
        operating_income: forms.pnl.operatingIncome || 0,
        ebitda: forms.pnl.ebitda || 0,
        net_income: forms.pnl.netIncome || 0,
        sold_production: forms.pnl.soldProduction,
        other_operating_revenue: forms.pnl.otherOperatingIncome,
        cost_of_goods_sold: forms.pnl.consumedPurchases,
        external_expenses: forms.pnl.externalExpenses,
        personnel_expenses: forms.pnl.personnelExpenses,
        taxes_and_duties: forms.pnl.taxesAndDuties,
        depreciation_and_amortization: forms.pnl.depreciationAmortization,
        financial_income: forms.pnl.financialIncome,
        financial_expenses: forms.pnl.financialExpenses,
        extraordinary_income: forms.pnl.exceptionalIncome,
        income_tax: forms.pnl.incomeTax,
      },
      cash_flow: {
        operating_cash_flow: forms.cashflow.operatingActivities || 0,
        investing_cash_flow: forms.cashflow.investingActivities || 0,
        financing_cash_flow: forms.cashflow.financingActivities || 0,
        free_cash_flow: forms.cashflow.freeCashFlow ?? undefined,
      }
    };
  }

  /** API Nested -> UI Form (for pre-filling) */
  static fromApi(raw: FinancialStatementOut) {
    return {
      assets: {
        intangibleAssets: raw.balance_sheet_assets.intangible_assets,
        tangibleAssets: raw.balance_sheet_assets.tangible_assets,
        financialAssets: raw.balance_sheet_assets.financial_assets,
        otherNonCurrentAssets: raw.balance_sheet_assets.other_noncurrent_assets,
        inventory: raw.balance_sheet_assets.inventory,
        accountsReceivable: raw.balance_sheet_assets.accounts_receivable,
        otherCurrentAssets: raw.balance_sheet_assets.other_current_assets,
        liquidAssets: raw.balance_sheet_assets.liquid_assets,
        totalAssets: raw.balance_sheet_assets.total_assets,
        currentAssetsTotal: raw.balance_sheet_assets.current_assets,
      },
      liabilities: {
        shareCapital: raw.balance_sheet_liabilities.share_capital,
        reserves: raw.balance_sheet_liabilities.reserves,
        retainedEarningsPrior: raw.balance_sheet_liabilities.retained_earnings_prior,
        currentYearEarnings: raw.balance_sheet_liabilities.current_year_earnings,
        shortTermDebt: raw.balance_sheet_liabilities.short_term_debt,
        accountsPayable: raw.balance_sheet_liabilities.accounts_payable,
        taxAndSocialLiabilities: raw.balance_sheet_liabilities.tax_and_social_liabilities,
        otherCurrentLiabilities: raw.balance_sheet_liabilities.other_current_liabilities,
        longTermDebt: raw.balance_sheet_liabilities.long_term_debt,
        longTermProvisions: raw.balance_sheet_liabilities.long_term_provisions,
        equityTotal: raw.balance_sheet_liabilities.equity,
        totalLiabilities: raw.balance_sheet_liabilities.total_liabilities,
        currentLiabilitiesTotal: raw.balance_sheet_liabilities.current_liabilities,
      },
      pnl: {
        revenue: raw.income_statement.revenue,
        soldProduction: raw.income_statement.sold_production,
        otherOperatingIncome: raw.income_statement.other_operating_revenue,
        consumedPurchases: raw.income_statement.cost_of_goods_sold,
        externalExpenses: raw.income_statement.external_expenses,
        personnelExpenses: raw.income_statement.personnel_expenses,
        taxesAndDuties: raw.income_statement.taxes_and_duties,
        depreciationAmortization: raw.income_statement.depreciation_and_amortization,
        operatingIncome: raw.income_statement.operating_income,
        ebitda: raw.income_statement.ebitda,
        netIncome: raw.income_statement.net_income,
        financialIncome: raw.income_statement.financial_income,
        financialExpenses: raw.income_statement.financial_expenses,
        exceptionalIncome: raw.income_statement.extraordinary_income,
        incomeTax: raw.income_statement.income_tax,
      },
      cashflow: {
        operatingActivities: raw.cash_flow.operating_cash_flow,
        investingActivities: raw.cash_flow.investing_cash_flow,
        financingActivities: raw.cash_flow.financing_cash_flow,
        freeCashFlow: raw.cash_flow.free_cash_flow,
        beginningCashBalance: 0, // TODO: non persisté dans le schéma API actuel
        capex: 0,                // TODO: non persisté dans le schéma API actuel — free_cash_flow est calculé côté UI
      },
      others: {
        currency: raw.currency_original,
        exchangeRateToUsd: raw.exchange_rate_to_usd,
        referentiel: raw.referentiel,
        isConsolidated: raw.is_consolidated,
      }
    };
  }
}
