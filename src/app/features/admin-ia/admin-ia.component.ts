import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminIaService } from './services/admin-ia.service';
import { IaDashboardData, IaModelInfo } from '../../core/models/ia-admin.model';
import {
  ModelListComponent,
  PerformanceMetricsComponent,
  FeatureImportanceComponent,
  MonitoringAlertsComponent,
  ModelConfigDialogComponent
} from './components';

@Component({
  selector: 'app-admin-ia',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    ModelListComponent,
    PerformanceMetricsComponent,
    FeatureImportanceComponent,
    MonitoringAlertsComponent
  ],
  templateUrl: './admin-ia.component.html',
  styleUrls: ['./admin-ia.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminIaComponent implements OnInit {
  private iaService = inject(AdminIaService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  dashboardData = signal<IaDashboardData | null>(null);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.isLoading.set(true);
    // [UI SIMULATION] - The service implements Rule 16 (Mock-First Development)
    this.iaService.getDashboardData().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Error connecting to ML Ops backend.', 'Close', { duration: 3000 });
      }
    });
  }

  openModelConfig(model: IaModelInfo): void {
    const data = this.dashboardData();
    if (!data) return;

    // Simulate fetching config for specific model (using active config for all in this mock)
    this.dialog.open(ModelConfigDialogComponent, {
      width: '600px',
      data: {
        version: model.version,
        config: data.active_model_config
      }
    });
  }
}