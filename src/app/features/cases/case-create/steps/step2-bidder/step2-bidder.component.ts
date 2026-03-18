import { Component, ChangeDetectionStrategy, input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, debounceTime, distinctUntilChanged, switchMap, startWith, of } from 'rxjs';

import { BidderService } from '../../../../../core/services/bidder.service';
import { BidderSearchOut } from '../../../../../core/models/bidder.model';

@Component({
    selector: 'app-step2-bidder',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule
    ],
    templateUrl: './step2-bidder.component.html',
    styleUrls: ['./step2-bidder.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Step2BidderComponent implements OnInit {
    readonly formGroup = input.required<FormGroup>();
    private readonly bidderService = inject(BidderService);

    // Observable géré nativement via le pipe | async du template (zéro fuite mémoire)
    filteredBidders$!: Observable<BidderSearchOut[]>;

    ngOnInit(): void {
        const nameControl = this.formGroup().get('bidder_name');

        if (nameControl) {
            this.filteredBidders$ = nameControl.valueChanges.pipe(
                startWith(''),
                debounceTime(300),
                distinctUntilChanged(),
                switchMap(value => {
                    if (typeof value === 'string' && value.length > 2) {
                        return this.bidderService.searchBidders(value);
                    }
                    return of([]); // Renvoie un tableau vide si < 3 caractères
                })
            );
        }
    }

    onBidderSelected(bidder: BidderSearchOut): void {
        // Patch des données de l'entreprise existante
        this.formGroup().patchValue({
            bidder_id: bidder.id,
            bidder_name: bidder.name,
            legal_form: bidder.legal_form || '',
            email: bidder.email || '',
            country: bidder.country || ''
        });

        // On verrouille les champs car ce sont des données consolidées
        this.toggleFields(false);
    }

    resetBidder(): void {
        // Réinitialisation complète pour une saisie manuelle (nouveau soumissionnaire)
        this.formGroup().patchValue({
            bidder_id: null,
            bidder_name: '',
            legal_form: '',
            registration_number: '',
            email: '',
            phone: '',
            country: ''
        });

        this.toggleFields(true);
    }

    private toggleFields(enable: boolean): void {
        const controlsToToggle = ['legal_form', 'registration_number', 'email', 'phone', 'country'];
        controlsToToggle.forEach(ctrl => {
            const control = this.formGroup().get(ctrl);
            if (control) {
                enable ? control.enable() : control.disable();
            }
        });
    }
}