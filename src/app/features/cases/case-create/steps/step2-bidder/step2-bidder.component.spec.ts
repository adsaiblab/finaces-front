import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Step2BidderComponent } from './step2-bidder.component';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BidderService } from '../../../../../core/services/bidder.service';
import { provideAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Step2BidderComponent', () => {
    let component: Step2BidderComponent;
    let fixture: ComponentFixture<Step2BidderComponent>;
    let fb: FormBuilder;
    let form: FormGroup;
    let mockBidderService: any;

    beforeEach(async () => {
        // Mock du service de recherche
        mockBidderService = {
            searchBidders: vi.fn().mockReturnValue(of([]))
        };

        await TestBed.configureTestingModule({
            imports: [Step2BidderComponent, ReactiveFormsModule],
            providers: [
                provideAnimations(),
                { provide: BidderService, useValue: mockBidderService }
            ]
        }).compileComponents();

        fb = TestBed.inject(FormBuilder);
        form = fb.group({
            bidder_id: [null],
            bidder_name: [''],
            legal_form: [''],
            registration_number: [''],
            email: [''],
            phone: [''],
            country: ['']
        });

        fixture = TestBed.createComponent(Step2BidderComponent);
        component = fixture.componentInstance;

        // Injection du Signal
        fixture.componentRef.setInput('formGroup', form);
        fixture.detectChanges();
    });

    it('devrait créer le composant de l\'étape 2', () => {
        expect(component).toBeTruthy();
    });

    it('devrait initialiser l\'observable de recherche', () => {
        expect(component.filteredBidders$).toBeDefined();
    });
});