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
        capex: forms.cashflow.capex || 0,
        beginning_cash: forms.cashflow.beginningCashBalance || 0,
      }
    };
  }

  /** API Nested -> UI Form (for pre-filling) */
  static fromApi(raw: FinancialStatementOut) {
    const assets = raw.balance_sheet_assets ?? {};
    const liab = raw.balance_sheet_liabilities ?? {};
    const pnl = raw.income_statement ?? {};
    const cf = raw.cash_flow ?? {};

    return {
      assets: {
        intangibleAssets: (assets as any).intangible_assets ?? 0,
        tangibleAssets: (assets as any).tangible_assets ?? 0,
        financialAssets: (assets as any).financial_assets ?? 0,
        otherNonCurrentAssets: (assets as any).other_noncurrent_assets ?? 0,
        inventory: (assets as any).inventory ?? 0,
        accountsReceivable: (assets as any).accounts_receivable ?? 0,
        otherCurrentAssets: (assets as any).other_current_assets ?? 0,
        liquidAssets: (assets as any).liquid_assets ?? 0,
        totalAssets: (assets as any).total_assets ?? 0,
        currentAssetsTotal: (assets as any).current_assets ?? 0,
      },
      liabilities: {
        shareCapital: (liab as any).share_capital ?? 0,
        reserves: (liab as any).reserves ?? 0,
        retainedEarningsPrior: (liab as any).retained_earnings_prior ?? 0,
        currentYearEarnings: (liab as any).current_year_earnings ?? 0,
        shortTermDebt: (liab as any).short_term_debt ?? 0,
        accountsPayable: (liab as any).accounts_payable ?? 0,
        taxAndSocialLiabilities: (liab as any).tax_and_social_liabilities ?? 0,
        otherCurrentLiabilities: (liab as any).other_current_liabilities ?? 0,
        longTermDebt: (liab as any).long_term_debt ?? 0,
        longTermProvisions: (liab as any).long_term_provisions ?? 0,
        equityTotal: (liab as any).equity ?? 0,
        totalLiabilities: (liab as any).total_liabilities ?? 0,
        currentLiabilitiesTotal: (liab as any).current_liabilities ?? 0,
      },
      pnl: {
        revenue: (pnl as any).revenue ?? 0,
        soldProduction: (pnl as any).sold_production ?? 0,
        otherOperatingIncome: (pnl as any).other_operating_revenue ?? 0,
        consumedPurchases: (pnl as any).cost_of_goods_sold ?? 0,
        externalExpenses: (pnl as any).external_expenses ?? 0,
        personnelExpenses: (pnl as any).personnel_expenses ?? 0,
        taxesAndDuties: (pnl as any).taxes_and_duties ?? 0,
        depreciationAmortization: (pnl as any).depreciation_and_amortization ?? 0,
        operatingIncome: (pnl as any).operating_income ?? 0,
        ebitda: (pnl as any).ebitda ?? 0,
        netIncome: (pnl as any).net_income ?? 0,
        financialIncome: (pnl as any).financial_income ?? 0,
        financialExpenses: (pnl as any).financial_expenses ?? 0,
        exceptionalIncome: (pnl as any).extraordinary_income ?? 0,
        incomeTax: (pnl as any).income_tax ?? 0,
      },
      cashflow: {
        operatingActivities: (cf as any).operating_cash_flow ?? 0,
        investingActivities: (cf as any).investing_cash_flow ?? 0,
        financingActivities: (cf as any).financing_cash_flow ?? 0,
        freeCashFlow: (cf as any).free_cash_flow ?? 0,
        beginningCashBalance: (cf as any).beginning_cash ?? 0,
        capex: (cf as any).capex ?? 0,
      },
      others: {
        currency: raw.currency_original || 'MAD',
        exchangeRateToUsd: raw.exchange_rate_to_usd ?? 1.0,
        referentiel: raw.referentiel || 'PCM',
        isConsolidated: raw.is_consolidated ?? false,
      }
    };
  }
}
