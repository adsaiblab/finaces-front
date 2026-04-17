import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { 
  ConvergenceDataPoint, 
  IaDashboardData, 
  IaMonitoringAlert, 
  IaModelInfo 
} from '../../../core/models/ia-admin.model';

@Injectable({ providedIn: 'root' })
export class AdminIaService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  /**
   * Aggregates multiple API calls to satisfy the dashboard UI's data requirement.
   * Hits /admin-ia/stats, /admin-ia/runs, and /admin-ia/events.
   */
  getDashboardData(): Observable<IaDashboardData> {
    return forkJoin({
      stats: this.http.get<any>(`${this.apiUrl}/admin-ia/stats`),
      runs: this.http.get<any[]>(`${this.apiUrl}/admin-ia/runs`),
      events: this.http.get<any[]>(`${this.apiUrl}/admin-ia/events`)
    }).pipe(
      map(({ stats, runs, events }) => {
        // Map backend Training Runs to UI Model Info
        const models: IaModelInfo[] = runs.map(run => ({
          model_id: run.id,
          version: run.model_artifact_path ? run.model_artifact_path.split('/').pop() : 'In Training',
          status: run.status === 'COMPLETED' ? (stats.active_model?.training_run_id === run.id ? 'ACTIVE' : 'ARCHIVED') : 'TESTING',
          deployed_at: run.completed_at || run.created_at,
          accuracy: run.metrics?.accuracy || 0,
          f1_score: run.metrics?.f1_score || 0,
          roc_auc: run.metrics?.auc || 0
        }));

        // Map backend Events to UI Alerts
        const alerts: IaMonitoringAlert[] = events.map(e => ({
          alert_id: e.id,
          severity: e.severity,
          type: 'ANOMALY', // Default mapping
          message: e.message,
          detected_at: e.created_at
        }));

        return {
          models: models,
          active_model_config: {
            algorithm: stats.active_model ? 'XGBoost' : 'None',
            hyperparameters: {}, // Would need a separate call or enriched stats
            features_count: 0,
            threshold: 0.5
          },
          global_metrics: {
            train: { accuracy: stats.latest_metrics?.accuracy || 0, f1_score: stats.latest_metrics?.f1_score || 0, roc_auc: stats.latest_metrics?.auc || 0 },
            val: { accuracy: 0, f1_score: 0, roc_auc: 0 },
            test: { accuracy: 0, f1_score: 0, roc_auc: 0 }
          },
          feature_importance: [], // To be implemented when backend supports it
          alerts: alerts
        };
      })
    );
  }

  getConvergenceChart(modelId: string): Observable<ConvergenceDataPoint[]> {
    // Backend doesn't have a real convergence chart endpoint yet, 
    // using a more stable fallback for now or keep mock if it's purely for aesthetics
    return this.http.get<ConvergenceDataPoint[]>(`${this.apiUrl}/admin-ia/runs/${modelId}/convergence`).pipe(
      map(data => data || [])
    );
  }
}
