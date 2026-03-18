import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-financials',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './financials.component.html',
  styleUrls: ['./financials.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinancialsComponent {}
