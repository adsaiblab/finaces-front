import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Step3SummaryComponent } from './step3-summary.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Step3SummaryComponent', () => {
    let component: Step3SummaryComponent;
    let fixture: ComponentFixture<Step3SummaryComponent>;
    let fb: FormBuilder;

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [Step3SummaryComponent] }).compileComponents();
        fb = TestBed.inject(FormBuilder);
        fixture = TestBed.createComponent(Step3SummaryComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('parentForm', fb.group({ marketInfo: fb.group({}), bidder: fb.group({}) }));
        fixture.detectChanges();
    });

    it('devrait créer le composant', () => {
        expect(component).toBeTruthy();
    });
});