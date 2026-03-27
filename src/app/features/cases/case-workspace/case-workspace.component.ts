import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';

import { RouterModule, ActivatedRoute } from '@angular/router';
import { CaseContextService } from '../../../core/services/case-context.service';

@Component({
  selector: 'app-case-workspace',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './case-workspace.component.html',
  styleUrls: ['./case-workspace.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaseWorkspaceComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly caseContextService = inject(CaseContextService);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.caseContextService.setCaseId(id);
  }
}
