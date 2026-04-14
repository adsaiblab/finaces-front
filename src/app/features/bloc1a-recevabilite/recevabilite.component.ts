import { Component, ChangeDetectionStrategy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CaseService } from '../../core/services/case.service';
import { EvaluationCaseDetailOut } from '../../core/models/case.model';
import { CaseStatus } from '../../core/models/enums';
import { DatePipe, DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-recevabilite',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  providers: [DatePipe, DecimalPipe],
  templateUrl: './recevabilite.component.html',
  styleUrls: ['./recevabilite.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecevabiliteComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly caseService = inject(CaseService);

  readonly caseData = signal<EvaluationCaseDetailOut | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly CaseStatus = CaseStatus;

  ngOnInit(): void {
    const id = this.route.parent?.snapshot.paramMap.get('id');
    if (id) {
      this.caseService.getCaseDetail(id).subscribe({
        next: (data: EvaluationCaseDetailOut) => {
          this.caseData.set(data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
    }
  }

  goToGate(): void {
    const id = this.caseData()?.id;
    if (id) {
      this.router.navigate([`/cases/${id}/gate`]);
    }
  }
}
