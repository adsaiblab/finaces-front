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
}

export interface BilanActifSchema {
    liquid_assets: number;
    accounts_receivable: number;
    inventory: number;
    other_current_assets: number;
    current_assets?: number;
    tangible_assets: number;
    intangible_assets: number;
    financial_assets: number;
    other_noncurrent_assets: number;
    non_current_assets?: number;
    total_actif?: number;
}

export interface BilanPassifSchema {
    share_capital: number;
    reserves: number;
    retained_earnings_prior: number;
    current_year_earnings: number;
    total_equity?: number;
    short_term_debt: number;
    accounts_payable: number;
    tax_and_social_liabilities: number;
    other_current_liabilities: number;
    total_current_liabilities?: number;
    long_term_debt: number;
    long_term_provisions: number;
    total_non_current_liabilities?: number;
    total_liabilities_and_equity?: number;
}

export interface IncomeStatementSchema {
    revenue: number;
    sold_production: number;
    other_operating_revenue: number;
    operating_revenue?: number;
    operating_expenses: number;
    operating_income?: number;
    financial_revenue: number;
    financial_expenses: number;
    financial_income?: number;
    income_before_tax?: number;
    extraordinary_income: number;
    extraordinary_expenses: number;
    income_tax: number;
    net_income?: number;
    ebitda: number;
}

export interface CashFlowSchema {
    operating_cash_flow: number;
    investing_cash_flow: number;
    financing_cash_flow: number;
    change_in_cash?: number;
    beginning_cash: number;
    ending_cash?: number;
    headcount: number;
    backlog_value: number;
    capex: number;
    dividends: number;
}

export interface FinancialStatementCreate {
    fiscal_year: number;
    bilan_actif: BilanActifSchema;
    bilan_passif: BilanPassifSchema;
    income_statement: IncomeStatementSchema;
    cash_flow: CashFlowSchema;
}

export interface FinancialStatementRawOut {
    id: string;
    case_id: string;
    fiscal_year: number;
    bilan_actif: BilanActifSchema;
    bilan_passif: BilanPassifSchema;
    income_statement: IncomeStatementSchema;
    cash_flow: CashFlowSchema;
    created_at: string;
    updated_at: string;
}

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
}

export interface NormalizationAdjustment {
    line_item: string;
    original_value: number;
    adjusted_value: number;
    reason: string;
    confidence: number;
}