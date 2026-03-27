import { NgClass, DatePipe, PercentPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { IaModelInfo } from '../../../../core/models/ia-admin.model';

@Component({
    selector: 'app-model-list',
    standalone: true,
    imports: [MatButtonModule, NgClass, DatePipe, PercentPipe],
    templateUrl: './model-list.component.html',
    styleUrls: ['./model-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModelListComponent {
    // Règle 2 : Pas de required, fallback tableau vide
    models = input<IaModelInfo[]>([]);
    viewConfig = output<IaModelInfo>();
}