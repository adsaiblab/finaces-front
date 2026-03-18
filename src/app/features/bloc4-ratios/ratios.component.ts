import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ratios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ratios.component.html',
  styleUrls: ['./ratios.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RatiosComponent {}
