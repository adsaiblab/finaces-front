import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-reporting',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reporting.component.html',
  styleUrls: ['./reporting.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportingComponent {}
