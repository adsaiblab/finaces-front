import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Step1MarketInfoComponent } from './step1-market-info.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Step1MarketInfoComponent', () => {
    let component: Step1MarketInfoComponent;
    let fixture: ComponentFixture<Step1MarketInfoComponent>;
    let fb: FormBuilder;
    let form: FormGroup;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Step1MarketInfoComponent, ReactiveFormsModule],
            providers: [provideAnimations()]
        }).compileComponents();

        fb = TestBed.inject(FormBuilder);
        form = fb.group({
            case_type: ['SINGLE'],
            market_reference: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}-\d{4}-\d{3}$/)]],
            market_label: [''],
            contract_value: [null],
            contract_currency: ['EUR'],
            contract_duration_months: [null],
            country: [''],
            sector: [''],
            sensitive: [false],
            notes: ['']
        });

        fixture = TestBed.createComponent(Step1MarketInfoComponent);
        component = fixture.componentInstance;

        // Injection du FormGroup dans le Signal input
        fixture.componentRef.setInput('formGroup', form);
        fixture.detectChanges();
    });

    it('devrait créer le composant de l\'étape 1', () => {
        expect(component).toBeTruthy();
    });

    it('devrait relier les contrôles du formulaire au template', () => {
        const compiled = fixture.nativeElement as HTMLElement;
        const refInput = compiled.querySelector('input[formControlName="market_reference"]');
        expect(refInput).toBeTruthy();
    });
});