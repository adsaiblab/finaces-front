import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup, FormArray } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';

import { CaseService } from '../../../core/services/case.service';
import { CaseType, CaseStatus } from '../../../core/models/case.model';

import { Step1MarketInfoComponent } from './steps/step1-market-info/step1-market-info.component';
import { Step2BidderComponent } from './steps/step2-bidder/step2-bidder.component';
import { Step3SummaryComponent } from './steps/step3-summary/step3-summary.component';
import { Step4ConfirmationComponent } from './steps/step4-confirmation/step4-confirmation.component';
import { GroupementMembersComponent } from './components/groupement-members/groupement-members.component';

@Component({
    selector: 'app-case-create',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatStepperModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
        RouterLink,
        Step1MarketInfoComponent,
        Step2BidderComponent,
        Step3SummaryComponent,
        Step4ConfirmationComponent,
        GroupementMembersComponent
    ],
    templateUrl: './case-create.component.html',
    styleUrls: ['./case-create.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CaseCreateComponent {
    private readonly fb = inject(FormBuilder);
    private readonly caseService = inject(CaseService);
    private readonly router = inject(Router);
    private readonly snackBar = inject(MatSnackBar);

    // Gestion du loading UX
    readonly isSubmitting = signal<boolean>(false);

    readonly caseForm = this.fb.group({
        marketInfo: this.fb.group({
            case_type: [CaseType.SINGLE, Validators.required],
            market_reference: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}-\d{4}-\d{3}$/)]],
            market_label: ['', Validators.required],
            contract_value: [null as number | null, [Validators.required, Validators.min(0)]],
            contract_currency: ['EUR', Validators.required],
            contract_duration_months: [null as number | null, [Validators.required, Validators.min(1)]],
            country: ['', Validators.required],
            sector: ['', Validators.required],
            sensitive: [false],
            notes: ['']
        }),
        bidder: this.fb.group({
            bidder_id: [null as string | null],
            bidder_name: ['', Validators.required],
            legal_form: [''],
            registration_number: [''],
            email: ['', Validators.email],
            phone: [''],
            country: ['', Validators.required]
        }),
        groupement: this.fb.group({
            members: this.fb.array([])
        })
    });

    get marketInfoForm(): FormGroup { return this.caseForm.get('marketInfo') as FormGroup; }
    get bidderForm(): FormGroup { return this.caseForm.get('bidder') as FormGroup; }
    get groupementMembersArray(): FormArray { return this.caseForm.get('groupement.members') as FormArray; }

    saveDraft(): void {
        if (this.isSubmitting()) return;
        this.isSubmitting.set(true);

        const payload = this.buildPayload();
        this.caseService.saveCaseDraft(payload).subscribe({
            next: () => {
                this.isSubmitting.set(false);
                this.snackBar.open('Brouillon sauvegardé avec succès.', 'Fermer', { duration: 3000, panelClass: 'success-snackbar' });
            },
            error: () => {
                this.isSubmitting.set(false);
                this.snackBar.open('Erreur lors de la sauvegarde du brouillon.', 'Fermer', { duration: 5000, panelClass: 'error-snackbar' });
            }
        });
    }

    submitCase(): void {
        if (this.isSubmitting() || this.caseForm.invalid) return;
        this.isSubmitting.set(true);

        const payload = { ...this.buildPayload(), status: CaseStatus.PENDING_GATE };
        this.caseService.createCase(payload).subscribe({
            next: (res) => {
                this.isSubmitting.set(false);
                this.snackBar.open('Dossier créé avec succès.', 'Fermer', { duration: 3000, panelClass: 'success-snackbar' });
                this.router.navigate(['/cases', res.id]);
            },
            error: () => {
                this.isSubmitting.set(false);
                this.snackBar.open('Erreur critique lors de la création du dossier.', 'Fermer', { duration: 5000, panelClass: 'error-snackbar' });
            }
        });
    }

    private buildPayload(): any {
        const rawValue = this.caseForm.getRawValue();
        return {
            ...rawValue.marketInfo,
            ...rawValue.bidder,
            members: rawValue.groupement.members
        };
    }
}