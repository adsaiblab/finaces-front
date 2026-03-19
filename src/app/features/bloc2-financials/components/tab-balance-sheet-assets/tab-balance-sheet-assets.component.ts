import { Component, ChangeDetectionStrategy, input, output, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
    selector: 'app-tab-balance-sheet-assets',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
    templateUrl: './tab-balance-sheet-assets.component.html',
    styleUrls: ['./tab-balance-sheet-assets.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabBalanceSheetAssetsComponent implements OnInit {
    private fb = inject(FormBuilder);

    // L'année en cours d'édition
    public year = input.required<number>();

    // Émission des données validées vers le parent
    public assetsDataChange = output<{ total: number, data: any }>();

    public assetsForm: FormGroup = this.fb.group({
        currentAssets: this.fb.group({
            cash: [0, [Validators.required, Validators.min(0)]],
            accountsReceivable: [0, [Validators.required, Validators.min(0)]],
            inventory: [0, [Validators.required, Validators.min(0)]]
        }),
        nonCurrentAssets: this.fb.group({
            propertyPlantEquipment: [0, [Validators.required, Validators.min(0)]],
            intangibleAssets: [0, [Validators.required, Validators.min(0)]]
        })
    });

    // Utilisation de toSignal pour convertir le flux du formulaire en Signal calculé
    public totalAssets = toSignal(
        this.assetsForm.valueChanges.pipe(
            map(values => {
                const current = values.currentAssets;
                const nonCurrent = values.nonCurrentAssets;
                const totalCurrent = (current?.cash || 0) + (current?.accountsReceivable || 0) + (current?.inventory || 0);
                const totalNonCurrent = (nonCurrent?.propertyPlantEquipment || 0) + (nonCurrent?.intangibleAssets || 0);
                return totalCurrent + totalNonCurrent;
            })
        ),
        { initialValue: 0 }
    );

    ngOnInit(): void {
        // Écoute les changements pour remonter l'info au parent (Debounce possible ici)
        this.assetsForm.valueChanges.subscribe(val => {
            if (this.assetsForm.valid) {
                this.assetsDataChange.emit({
                    total: this.totalAssets(),
                    data: val
                });
            }
        });
    }
}