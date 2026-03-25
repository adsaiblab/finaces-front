import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnalystDecisionComponent } from './analyst-decision.component';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('AnalystDecisionComponent', () => {
    let component: AnalystDecisionComponent;
    let fixture: ComponentFixture<AnalystDecisionComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AnalystDecisionComponent, NoopAnimationsModule]
        }).compileComponents();

        fixture = TestBed.createComponent(AnalystDecisionComponent);
        component = fixture.componentInstance;

        fixture.componentRef.setInput('requiresJustification', false);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit decision when valid', () => {
        const emitSpy = vi.spyOn(component.decisionSubmitted, 'emit');
        component.decisionForm.patchValue({
            decision: 'FOLLOW_MCC',
            justification: 'Looks good',
            escalate_to_senior: false
        });
        component.submitDecision();
        expect(emitSpy).toHaveBeenCalled();
    });
});