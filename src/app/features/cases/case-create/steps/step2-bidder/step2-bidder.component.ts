import { Component, ChangeDetectionStrategy, input, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Observable, debounceTime, distinctUntilChanged, switchMap, startWith, of } from 'rxjs';
import { BidderService } from '../../../../../core/services/bidder.service';
import { BidderSearchOut } from '../../../../../core/models/bidder.model';

@Component({
    selector: 'app-step2-bidder',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatIconModule, MatButtonModule],
    templateUrl: './step2-bidder.component.html',
    styleUrls: ['./step2-bidder.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Step2BidderComponent implements OnInit {
    readonly formGroup = input.required<FormGroup>();
    private readonly bidderService = inject(BidderService);
    filteredBidders$!: Observable<BidderSearchOut[]>;

    ngOnInit(): void {
        const nameControl = this.formGroup().get('bidder_name');
        if (nameControl) {
            this.filteredBidders$ = nameControl.valueChanges.pipe(
                startWith(''), debounceTime(300), distinctUntilChanged(),
                switchMap(val => (typeof val === 'string' && val.length > 2) ? this.bidderService.searchBidders(val) : of([]))
            );
        }
    }

    onBidderSelected(bidder: BidderSearchOut): void {
        this.formGroup().patchValue({ bidder_id: bidder.id, bidder_name: bidder.name, legal_form: bidder.legal_form || '', email: bidder.email || '', country: bidder.country || '' });
        this.toggleFields(false);
    }

    resetBidder(): void {
        this.formGroup().patchValue({ bidder_id: null, bidder_name: '', legal_form: '', registration_number: '', email: '', phone: '', country: '' });
        this.toggleFields(true);
    }

    private toggleFields(enable: boolean): void {
        ['legal_form', 'registration_number', 'email', 'phone', 'country'].forEach(ctrl => {
            const control = this.formGroup().get(ctrl);
            if (control) { enable ? control.enable() : control.disable(); }
        });
    }
}