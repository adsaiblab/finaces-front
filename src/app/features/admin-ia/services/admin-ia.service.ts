import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ConvergenceDataPoint, IaDashboardData } from '../../../core/models/ia-admin.model';

@Injectable({ providedIn: 'root' })
export class AdminIaService {
  // [UI SIMULATION] - Règle 16: Massive realistic mock data
  getDashboardData(): Observable<IaDashboardData> {
    const mockData: IaDashboardData = {
      models: [
        {
          model_id: 'MOD-001',
          version: 'FinaCES-v2.1.0',
          status: 'ACTIVE',
          deployed_at: '2026-01-15T00:00:00Z',
          accuracy: 0.94,
          f1_score: 0.92,
          roc_auc: 0.96,
        },
        {
          model_id: 'MOD-002',
          version: 'FinaCES-v2.2.0-RC',
          status: 'TESTING',
          deployed_at: '2026-03-20T00:00:00Z',
          accuracy: 0.95,
          f1_score: 0.94,
          roc_auc: 0.97,
        },
        {
          model_id: 'MOD-000',
          version: 'FinaCES-v1.9.4',
          status: 'ARCHIVED',
          deployed_at: '2025-08-10T00:00:00Z',
          accuracy: 0.89,
          f1_score: 0.88,
          roc_auc: 0.91,
        },
      ],
      active_model_config: {
        algorithm: 'XGBoost Classifier',
        hyperparameters: { max_depth: 6, learning_rate: 0.05, n_estimators: 200, subsample: 0.8 },
        features_count: 42,
        threshold: 0.65,
      },
      global_metrics: {
        train: { accuracy: 0.98, f1_score: 0.97, roc_auc: 0.99 },
        val: { accuracy: 0.95, f1_score: 0.93, roc_auc: 0.96 },
        test: { accuracy: 0.94, f1_score: 0.92, roc_auc: 0.96 },
      },
      feature_importance: [
        {
          feature_name: 'Current Ratio (Y-1)',
          pillar: 'LIQUIDITY',
          importance_score: 0.85,
          direction: 'POSITIVE',
        },
        {
          feature_name: 'Debt to Equity',
          pillar: 'SOLVENCY',
          importance_score: 0.72,
          direction: 'NEGATIVE',
        },
        {
          feature_name: 'Operating Margin',
          pillar: 'PROFITABILITY',
          importance_score: 0.65,
          direction: 'POSITIVE',
        },
        {
          feature_name: 'DSO (Days Sales Outstanding)',
          pillar: 'LIQUIDITY',
          importance_score: 0.55,
          direction: 'NEGATIVE',
        },
        {
          feature_name: 'Sector Default Rate',
          pillar: 'MACRO',
          importance_score: 0.45,
          direction: 'NEGATIVE',
        },
        {
          feature_name: 'Cash Flow to Debt',
          pillar: 'SOLVENCY',
          importance_score: 0.4,
          direction: 'POSITIVE',
        },
      ],
      alerts: [
        {
          alert_id: 'ALRT-901',
          severity: 'HIGH',
          type: 'DATA_DRIFT',
          message:
            'Significant shift detected in "Operating Margin" distribution for Construction sector.',
          detected_at: '2026-03-25T14:30:00Z',
        },
        {
          alert_id: 'ALRT-902',
          severity: 'MEDIUM',
          type: 'ANOMALY',
          message: 'Spike in missing values for "Backlog Revenue" input.',
          detected_at: '2026-03-24T09:15:00Z',
        },
        {
          alert_id: 'ALRT-903',
          severity: 'LOW',
          type: 'CONCEPT_DRIFT',
          message: 'Minor degradation in recall for "High Risk" class over last 30 days.',
          detected_at: '2026-03-20T11:00:00Z',
        },
      ],
    };
    return of(mockData).pipe(delay(800));
  }

  getConvergenceChart(_modelId: string): Observable<ConvergenceDataPoint[]> {
    const mockData: ConvergenceDataPoint[] = Array.from({ length: 40 }, (_, i) => ({
      epoch: i + 1,
      train_loss: parseFloat((0.85 * Math.exp(-i * 0.07) + 0.05).toFixed(4)),
      val_loss: parseFloat(
        (0.92 * Math.exp(-i * 0.065) + 0.07 + (Math.random() * 0.02 - 0.01)).toFixed(4),
      ),
      auc_roc: parseFloat((0.5 + (0.47 * i) / 39).toFixed(4)),
    }));
    return of(mockData).pipe(delay(600));
  }
}
