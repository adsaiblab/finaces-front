import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-normalization',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './normalization.component.html',
  styleUrls: ['./normalization.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NormalizationComponent {}
