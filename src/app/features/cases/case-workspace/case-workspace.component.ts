import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-case-workspace',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './case-workspace.component.html',
  styleUrls: ['./case-workspace.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CaseWorkspaceComponent {}
