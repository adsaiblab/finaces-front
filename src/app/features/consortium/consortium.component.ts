import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-consortium',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './consortium.component.html',
  styleUrls: ['./consortium.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConsortiumComponent {}
