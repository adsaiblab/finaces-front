// Backend target structure (snake_case)
export interface IaModelInfo {
  model_id: string;
  version: string;
  status: 'ACTIVE' | 'TESTING' | 'ARCHIVED';
  deployed_at: string;
  accuracy: number;
  f1_score: number;
  roc_auc: number;
}

export interface IaFeatureImportance {
  feature_name: string;
  pillar: 'LIQUIDITY' | 'SOLVENCY' | 'PROFITABILITY' | 'CAPACITY' | 'QUALITY' | 'MACRO';
  importance_score: number; // 0 to 1
  direction: 'POSITIVE' | 'NEGATIVE';
}

export interface IaMonitoringAlert {
  alert_id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: 'DATA_DRIFT' | 'CONCEPT_DRIFT' | 'ANOMALY';
  message: string;
  detected_at: string;
}

export interface IaDashboardData {
  models: IaModelInfo[];
  active_model_config: any;
  global_metrics: {
    train: { accuracy: number; f1_score: number; roc_auc: number };
    val: { accuracy: number; f1_score: number; roc_auc: number };
    test: { accuracy: number; f1_score: number; roc_auc: number };
  };
  feature_importance: IaFeatureImportance[];
  alerts: IaMonitoringAlert[];
}
