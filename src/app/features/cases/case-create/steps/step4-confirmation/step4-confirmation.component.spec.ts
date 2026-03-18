import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Step4ConfirmationComponent } from './step4-confirmation.component';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Step4ConfirmationComponent', () => {
    let component: Step4ConfirmationComponent;
    let fixture: ComponentFixture<Step4ConfirmationComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({ imports: [Step4ConfirmationComponent] }).compileComponents();
        fixture = TestBed.createComponent(Step4ConfirmationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('devrait créer le composant', () => {
        expect(component).toBeTruthy();
    });
});