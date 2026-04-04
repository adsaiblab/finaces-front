
// ============================================================================
// Existing schemas (contract / legacy)
// ============================================================================

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

export interface Milestone {
  id: string;
  month: number;
  amount: number;
  description: string;
}

export interface StressParameters {
  contract_value: number;
  initial_cash: number;
  available_credit: number;
  operating_cash_flow: number;
  milestones: Milestone[];
}

export interface StressScenarioResult {
  scenario_name: string;
  description: string;
  min_cash_balance: number;
  months_in_negative: number;
  status: 'RESILIENT' | 'MARGINAL' | 'BREACH';
  cash_curve: number[];
}

export interface StressTestResponse {
  case_id: string;
  computed_at: string;
  base_parameters: StressParameters;
  scenarios: StressScenarioResult[];
}

// ============================================================================
// Dual-mode types (CONTRACT + MACRO_SHOCK)
// ============================================================================

export interface MilestoneSchema {
  month: number;
  amount: number;
  description: string;
}

export interface ContractStressInput {
  mode: 'CONTRACT';
  contract_value: number;
  contract_months: number;
  annual_ca_avg: number;
  cash_available: number;
  advance_pct: number;
  credit_lines: number;
  milestones: MilestoneSchema[];
  bfr_rate_sector: number;
}

export interface MacroShockInput {
  mode: 'MACRO_SHOCK';
  scenario_name: string;
  revenue_shock: number;
  cost_inflation: number;
  receivables_days_increase: number;
  payment_delays_days: number;
  interest_rate_increase: number;
  capex_reduction: number;
}

export type StressInput = ContractStressInput | MacroShockInput;

export interface CashFlowPoint {
  month: number;
  cash_position: number;
  revenue: number;
  costs: number;
}

export interface MacroShockResult {
  scenario_name: string;
  solvency_status: 'SOLVENT' | 'LIMIT' | 'INSOLVENT';
  minimum_cash_position: number;
  minimum_cash_date: string;
  days_to_default: number | null;
  flows: CashFlowPoint[];
  liquidity_coverage_ratio: number;
  debt_service_coverage_ratio: number;
}
