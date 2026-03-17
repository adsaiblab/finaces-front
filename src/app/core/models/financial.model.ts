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

export interface FinancialStatementCreate {
    fiscal_year: number;
    closing_date: string;
    accounting_standard: AccountingStandard;
    currency: CurrencyCode;
    revenue: number;
    cogs: number;
    gross_profit: number;
    ebitda: number;
    ebit: number;
    net_income: number;
    total_assets: number;
    current_assets: number;
    total_liabilities: number;
    current_liabilities: number;
    equity: number;
    cash: number;
    receivables: number;
    inventory: number;
    payables: number;
    short_term_debt: number;
    long_term_debt: number;
    depreciation_amortization: number;
    capex?: number;
    notes?: string;
}

export interface FinancialStatementRawOut {
    statement_id: string;
    case_id: string;
    fiscal_year: number;
    closing_date: string;
    accounting_standard: AccountingStandard;
    currency: CurrencyCode;
    revenue: number;
    cogs: number;
    gross_profit: number;
    ebitda: number;
    ebit: number;
    net_income: number;
    total_assets: number;
    current_assets: number;
    total_liabilities: number;
    current_liabilities: number;
    equity: number;
    cash: number;
    receivables: number;
    inventory: number;
    payables: number;
    short_term_debt: number;
    long_term_debt: number;
    depreciation_amortization: number;
    capex?: number;
    created_at: string;
    updated_at: string;
    notes?: string;
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