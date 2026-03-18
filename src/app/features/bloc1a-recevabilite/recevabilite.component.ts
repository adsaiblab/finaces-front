import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recevabilite',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recevabilite.component.html',
  styleUrls: ['./recevabilite.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecevabiliteComponent {}
