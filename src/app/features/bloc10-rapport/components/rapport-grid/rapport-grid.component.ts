import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-rapport-grid',
  standalone: true,
  imports: [],
  templateUrl: './rapport-grid.component.html',
  styleUrls: ['./rapport-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RapportGridComponent {
  // Using default values instead of input.required to prevent test crashes
  title = input<string>('Section Title');
  icon = input<string>('info');
}
