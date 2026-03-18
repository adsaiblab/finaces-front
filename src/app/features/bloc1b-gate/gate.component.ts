import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gate',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gate.component.html',
  styleUrls: ['./gate.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GateComponent {}
