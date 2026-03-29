import { NgClass } from '@angular/common';
import { Component, ChangeDetectionStrategy, input, output, signal } from '@angular/core';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export type DisclaimerVariant = 'banner' | 'inline' | 'chip';

@Component({
  selector: 'app-finaces-ia-disclaimer', // Note: Standalone components generally use 'app-' prefix
  standalone: true,
  imports: [MatIconModule, MatButtonModule, NgClass],
  templateUrl: './finaces-ia-disclaimer.component.html',
  styleUrls: ['./finaces-ia-disclaimer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinacesIaDisclaimerComponent {
  public variant = input<DisclaimerVariant>('banner');
  public dismissible = input<boolean>(false);
  public pilotMode = input<boolean>(false);

  public dismissed = output<void>();

  public isDismissed = signal<boolean>(false);

  public readonly disclaimerText =
    'This AI scoring is a NON-DECISIONAL challenger tool. It does not replace the official MCC score.';
  public readonly pilotModeText =
    'AI Pilot Mode: Experimental results, for informational purposes only.';

  public onDismiss(): void {
    this.isDismissed.set(true);
    this.dismissed.emit();
  }
}
