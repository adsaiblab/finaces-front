import { Component, ChangeDetectionStrategy, input } from '@angular/core';

import { RouterModule } from '@angular/router';

@Component({
  selector: 'finaces-pilot-mode-banner',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './finaces-pilot-mode-banner.component.html',
  styleUrls: ['./finaces-pilot-mode-banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinacesPilotModeBannerComponent {
  isActive = input<boolean>(false);
}
