import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ia.component.html',
  styleUrls: ['./ia.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IaComponent {}
