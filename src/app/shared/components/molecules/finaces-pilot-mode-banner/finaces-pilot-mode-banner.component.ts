import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'finaces-pilot-mode-banner',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './finaces-pilot-mode-banner.component.html',
    styleUrls: ['./finaces-pilot-mode-banner.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinacesPilotModeBannerComponent {
    isActive = input<boolean>(false);
}