export interface StressScenarioInputSchema {
    revenue_shock: number;
    cost_inflation: number;
    receivables_days_increase: number;
    payment_delays_days: number;
    interest_rate_increase: number;
    capex_reduction: number;
    initial_cash: number;
    scenario_name: string;
}

export interface PaymentMilestoneSchema {
    milestone_id: string;
    due_date: string;
    amount: number;
    status: 'SCHEDULED' | 'PAID' | 'DELAYED' | 'OVERDUE';
    days_overdue?: number;
}

export interface ScenarioFlowSchema {
    date: string;
    revenue: number;
    costs: number;
    receivables_balance: number;
    payables_balance: number;
    cash_balance: number;
    working_capital: number;
    debt_service_due: number;
}

export interface StressResultSchema {
    case_id: string;
    scenario_name: string;
    result_id: string;
    solvency_status: 'SOLVENT' | 'LIMIT' | 'INSOLVENT';
    minimum_cash_position: number;
    minimum_cash_date: string;
    days_to_default?: number;
    flows: ScenarioFlowSchema[];
    payment_milestones: PaymentMilestoneSchema[];
    liquidity_coverage_ratio: number;
    debt_service_coverage_ratio: number;
    computed_at: string;
    duration_days: number;
}