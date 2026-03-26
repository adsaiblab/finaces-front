import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConsortiumMemberAccordionComponent } from './consortium-member-accordion.component';
import { ComponentRef } from '@angular/core';

describe('ConsortiumMemberAccordionComponent', () => {
    let component: ConsortiumMemberAccordionComponent;
    let fixture: ComponentFixture<ConsortiumMemberAccordionComponent>;
    let componentRef: ComponentRef<ConsortiumMemberAccordionComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ConsortiumMemberAccordionComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(ConsortiumMemberAccordionComponent);
        component = fixture.componentInstance;
        componentRef = fixture.componentRef;
        
        // Initialize inputs using componentRef.setInput() as per Ng17+ Best Practices
        componentRef.setInput('member', { member_id: 'test-1', member_name: 'Test', role: 'MEMBER', participation_pct: 10, score: 3 });
        componentRef.setInput('isBlocking', false);
        componentRef.setInput('isWeakLink', false);
        
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});