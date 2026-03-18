import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-ia',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-ia.component.html',
  styleUrls: ['./admin-ia.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminIaComponent {}
