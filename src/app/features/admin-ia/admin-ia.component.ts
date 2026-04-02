import { Component, ChangeDetectionStrategy, inject, signal, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminIaService } from './services/admin-ia.service';
import { ConvergenceDataPoint, IaDashboardData, IaModelInfo } from '../../core/models/ia-admin.model';
import {
  ModelListComponent,
  PerformanceMetricsComponent,
  FeatureImportanceComponent,
  MonitoringAlertsComponent,
  ModelConfigDialogComponent,
} from './components';

@Component({
  selector: 'app-admin-ia',
  standalone: true,
  imports: [
    MatDialogModule,
    ModelListComponent,
    PerformanceMetricsComponent,
    FeatureImportanceComponent,
    MonitoringAlertsComponent,
    MatSnackBarModule,
  ],
  templateUrl: './admin-ia.component.html',
  styleUrls: ['./admin-ia.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminIaComponent implements OnInit {
  private readonly iaService = inject(AdminIaService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  dashboardData = signal<IaDashboardData | null>(null);
  convergenceData = signal<ConvergenceDataPoint[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.isLoading.set(true);
    this.iaService
      .getDashboardData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.dashboardData.set(data);
          this.isLoading.set(false);
          const activeModel = data.models.find((m) => m.status === 'ACTIVE');
          if (activeModel) {
            this.loadConvergenceChart(activeModel.model_id);
          }
        },
        error: () => {
          this.isLoading.set(false);
          this.snackBar.open('Error connecting to ML Ops backend.', 'Close', { duration: 3000 });
        },
      });
  }

  private loadConvergenceChart(modelId: string): void {
    this.iaService
      .getConvergenceChart(modelId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => this.convergenceData.set(data),
        error: () =>
          this.snackBar.open('Could not load convergence chart.', 'Close', { duration: 3000 }),
      });
  }

  openModelConfig(model: IaModelInfo): void {
    const data = this.dashboardData();
    if (!data) return;
    this.dialog.open(ModelConfigDialogComponent, {
      width: '600px',
      data: {
        version: model.version,
        config: data.active_model_config,
      },
    });
  }
}
