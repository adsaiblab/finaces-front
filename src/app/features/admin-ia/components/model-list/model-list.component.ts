import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { IaModelInfo } from '../../../../core/models/ia-admin.model';

@Component({
    selector: 'app-model-list',
    standalone: true,
    imports: [CommonModule, MatButtonModule],
    templateUrl: './model-list.component.html',
    styleUrls: ['./model-list.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModelListComponent {
    // Règle 2 : Pas de required, fallback tableau vide
    models = input<IaModelInfo[]>([]);
    viewConfig = output<IaModelInfo>();
}