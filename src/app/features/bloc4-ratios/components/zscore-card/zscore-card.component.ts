import { NgClass } from '@angular/common';
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import {  DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ZScoreGroup } from '../../../../core/models/ratio.model';

@Component({
    selector: 'app-zscore-card',
    standalone: true,
    imports: [MatCardModule, MatIconModule, DecimalPipe, NgClass],
    templateUrl: './zscore-card.component.html',
    styleUrls: ['./zscore-card.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ZscoreCardComponent {
    public zscore = input<ZScoreGroup>(null as unknown as ZScoreGroup);

    public isAlertMode = input<boolean>(false);

    public getIconColor(): string {
        const zone = this.zscore().z_score_zone;
        if (zone === 'DISTRESS') return 'text-[color:var(--color-error)]';
        if (zone === 'GREY') return 'text-[color:var(--color-warning)]';
        return 'text-[color:var(--color-success)]';
    }

    public getIcon(): string {
        const zone = this.zscore().z_score_zone;
        if (zone === 'DISTRESS') return 'error';
        if (zone === 'GREY') return 'warning';
        return 'verified_user';
    }
}